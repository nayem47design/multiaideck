// @vitest-environment node
import type { MockLanguageModelV4 } from "ai/test";
import { and, eq } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { appendEntry, balanceMcr } from "@/lib/billing/ledger";
import type { StreamEvent } from "@/lib/contracts/chat";
import type { Db } from "@/lib/db";
import {
  answers,
  bestAnswers,
  chats,
  ledgerEntries,
  prompts,
  users,
} from "@/lib/db/schema";
import { useTestDb } from "@/lib/db/testing";
import { COFFEE_CHAT } from "@/lib/mock/chat";

import { bus } from "./bus";
import { createDemoModel, DEMO_VERSION, setDemoSpeed } from "./demo";
import { INSTRUCTIONS } from "./history";
import { setMergeDelay } from "./merge";
import type { ModelId } from "./models";
import {
  retryAnswer,
  sendPrompt,
  setOrchestratorDeps,
  stopPrompt,
} from "./orchestrator";

// The orchestrator with the scripted demo model: answers are independent (rule 7), catch-up,
// and the money promises (failed and stopped answers cost nothing; 402 creates nothing).

let db: Db;
let models: Map<ModelId, MockLanguageModelV4>;
let restore: () => void;

async function newUser(phone: string, creditsMcr: number) {
  const [u] = await db.insert(users).values({ phone }).returning();
  if (creditsMcr)
    await appendEntry(db, {
      userId: u.id,
      kind: "topup",
      amountMcr: creditsMcr,
      idempotencyKey: `test-topup:${u.id}`,
    });
  return u.id;
}

/** Each call's messages as [role, text] pairs, per model. */
function calls(model: ModelId) {
  return (models.get(model)?.doStreamCalls ?? []).map((c) =>
    c.prompt.map((m) => [
      m.role,
      typeof m.content === "string"
        ? m.content
        : m.content.map((p) => ("text" in p ? p.text : "")).join(""),
    ]),
  );
}

const ledgerFor = (userId: string) =>
  db.select().from(ledgerEntries).where(eq(ledgerEntries.userId, userId));

beforeAll(async () => {
  db = await useTestDb();
  setDemoSpeed(0);
  setMergeDelay(0);
});

beforeEach(() => {
  models = new Map();
  restore = setOrchestratorDeps({
    timeoutMs: 300,
    demoMerge: true,
    resolveModel: (id) => {
      if (!models.has(id))
        models.set(id, createDemoModel(id) as MockLanguageModelV4);
      return { kind: "demo", model: models.get(id)!, version: DEMO_VERSION };
    },
  });
});

afterAll(() => {
  restore?.();
  setDemoSpeed(1);
  setMergeDelay(1);
});

describe("orchestrator", () => {
  it("keeps every answer independent across 3 prompts, a failure and a retry", async () => {
    const userId = await newUser("+8801700000001", 1_000_000);
    const { p1, p2, p3 } = COFFEE_CHAT.prompts;
    const trio: ModelId[] = ["gpt", "claude", "gemini"];

    const first = await sendPrompt(db, userId, {
      text: p1.text,
      mode: "compare",
      models: trio,
    });
    await first.job;
    const chatId = first.chatId;

    // Prompt 2 (scripted): GPT-5 times out, Gemini is unavailable, Claude answers.
    const second = await sendPrompt(db, userId, {
      chatId,
      text: p2.text,
      mode: "compare",
      models: trio,
    });
    await second.job;
    const p2Answers = await db
      .select()
      .from(answers)
      .where(eq(answers.promptId, second.promptId));
    const byModel = (m: ModelId) => p2Answers.find((a) => a.model === m)!;
    expect(byModel("gpt")).toMatchObject({
      status: "failed",
      failure: "timeout",
    });
    expect(byModel("gemini")).toMatchObject({
      status: "failed",
      failure: "unavailable",
    });
    expect(byModel("claude").status).toBe("done");

    // GPT-5 answers prompt 2 on retry.
    const retried = await retryAnswer(db, userId, byModel("gpt").id);
    await retried.job;
    const [retry] = await db
      .select()
      .from(answers)
      .where(eq(answers.retryOf, byModel("gpt").id));
    expect(retry.status).toBe("done");

    // Prompt 3 to all three: Gemini missed prompt 2, so it catches up.
    const events: StreamEvent[] = [];
    const third = await sendPrompt(db, userId, {
      chatId,
      text: p3.text,
      mode: "compare",
      models: trio,
    });
    const off = bus().subscribe(third.promptId, (e) => events.push(e));
    await third.job;
    off();

    // ---- Exact messages: the user's prompts and the model's own answers, nothing else.
    const all = await db
      .select()
      .from(answers)
      .where(eq(answers.chatId, chatId));
    const own = (m: ModelId, promptId: string) =>
      all
        .filter(
          (a) =>
            a.model === m && a.promptId === promptId && a.status === "done",
        )
        .at(-1)!.text;

    const lastCall = (m: ModelId) => calls(m).at(-1)!;
    expect(lastCall("gemini")).toEqual([
      ["system", INSTRUCTIONS],
      ["user", p1.text],
      ["assistant", own("gemini", first.promptId)],
      ["user", p2.text], // missed: no answer of its own, and nobody else's
      ["user", p3.text],
    ]);
    expect(lastCall("gpt")).toEqual([
      ["system", INSTRUCTIONS],
      ["user", p1.text],
      ["assistant", own("gpt", first.promptId)],
      ["user", p2.text],
      ["assistant", retry.text], // its own retried answer
      ["user", p3.text],
    ]);
    expect(lastCall("claude")).toEqual([
      ["system", INSTRUCTIONS],
      ["user", p1.text],
      ["assistant", own("claude", first.promptId)],
      ["user", p2.text],
      ["assistant", own("claude", second.promptId)],
      ["user", p3.text],
    ]);
    // The retry itself saw only prompt 1, GPT's own answer, and prompt 2.
    expect(calls("gpt").at(-2)).toEqual([
      ["system", INSTRUCTIONS],
      ["user", p1.text],
      ["assistant", own("gpt", first.promptId)],
      ["user", p2.text],
    ]);

    // No call ever contains another model's answer text.
    for (const m of trio) {
      const others = all
        .filter((a) => a.model !== m && a.text)
        .map((a) => a.text);
      for (const call of calls(m))
        for (const [, text] of call)
          for (const other of others) expect(text).not.toContain(other);
    }

    // ---- Catch-up: Gemini read prompt 2 first; that cost is recorded apart.
    const p3Answers = all.filter((a) => a.promptId === third.promptId);
    const gemini3 = p3Answers.find((a) => a.model === "gemini")!;
    expect(gemini3.status).toBe("done");
    expect(gemini3.catchUpTokens).toBeGreaterThan(0);
    expect(gemini3.catchUpCostMcr).toBeGreaterThan(0);
    expect(p3Answers.find((a) => a.model === "gpt")!.catchUpTokens).toBe(0);
    expect(
      events.some(
        (e) =>
          e.type === "answer-status" &&
          e.answerId === gemini3.id &&
          e.status === "catching-up",
      ),
    ).toBe(true);
    expect(events.at(-1)?.type).toBe("done");
  });

  it("charges nothing for timed-out and unavailable answers", async () => {
    const userId = await newUser("+8801700000002", 1_000_000);
    const before = await balanceMcr(db, userId);
    const s = await sendPrompt(db, userId, {
      text: "Plan a picnic #timeout:gpt #unavailable:gemini",
      mode: "compare",
      models: ["gpt", "claude", "gemini"],
    });
    await s.job;
    const rows = await db
      .select()
      .from(answers)
      .where(eq(answers.promptId, s.promptId));
    const failed = rows.filter((a) => a.status === "failed");
    expect(failed.map((a) => a.failure).sort()).toEqual([
      "timeout",
      "unavailable",
    ]);
    const ledger = await ledgerFor(userId);
    for (const a of failed) {
      expect(a.costMcr).toBe(0);
      const entries = ledger.filter((e) => e.refId === a.id);
      expect(entries.some((e) => e.kind === "charge")).toBe(false);
      expect(entries.reduce((s, e) => s + e.amountMcr, 0)).toBe(0);
    }
    const claude = rows.find((a) => a.model === "claude")!;
    expect(await balanceMcr(db, userId)).toBe(
      before - claude.costMcr - claude.catchUpCostMcr,
    );
  });

  it("stops unfinished answers and charges nothing for them", async () => {
    const userId = await newUser("+8801700000003", 1_000_000);
    const before = await balanceMcr(db, userId);
    setDemoSpeed(1);
    try {
      const s = await sendPrompt(db, userId, {
        text: "Write a long story #slow",
        mode: "best",
        models: ["gpt", "claude", "gemini"],
      });
      await stopPrompt(db, userId, s.promptId);
      await s.job;
      const rows = await db
        .select()
        .from(answers)
        .where(eq(answers.promptId, s.promptId));
      expect(rows.every((a) => a.status === "stopped")).toBe(true);
      const [p] = await db
        .select()
        .from(prompts)
        .where(eq(prompts.id, s.promptId));
      expect(p.status).toBe("stopped");
      const [best] = await db
        .select()
        .from(bestAnswers)
        .where(eq(bestAnswers.promptId, s.promptId));
      expect(best.status).toBe("failed");
      expect(await balanceMcr(db, userId)).toBe(before);
    } finally {
      setDemoSpeed(0);
    }
  });

  it("creates nothing when the balance can't cover the reserve (402)", async () => {
    const userId = await newUser("+8801700000004", 500); // half a credit
    await expect(
      sendPrompt(db, userId, {
        text: "Hello",
        mode: "best",
        models: ["gpt", "claude", "gemini"],
      }),
    ).rejects.toMatchObject({ status: 402, code: "insufficient_credits" });
    expect(
      await db.select().from(chats).where(eq(chats.userId, userId)),
    ).toEqual([]);
    expect(
      await db.select().from(prompts).where(eq(prompts.userId, userId)),
    ).toEqual([]);
    const ledger = await ledgerFor(userId);
    expect(ledger.filter((e) => e.kind !== "topup")).toEqual([]);
    expect(await balanceMcr(db, userId)).toBe(500);
  });

  it("leaves balance = before − charges after a Best answer prompt", async () => {
    const userId = await newUser("+8801700000005", 1_000_000);
    const before = await balanceMcr(db, userId);
    const s = await sendPrompt(db, userId, {
      text: COFFEE_CHAT.prompts.p1.text,
      mode: "best",
      models: ["gpt", "claude", "gemini"],
    });
    await s.job;
    const rows = await db
      .select()
      .from(answers)
      .where(eq(answers.promptId, s.promptId));
    const [best] = await db
      .select()
      .from(bestAnswers)
      .where(eq(bestAnswers.promptId, s.promptId));
    expect(rows.every((a) => a.status === "done")).toBe(true);
    expect(best.status).toBe("done");
    expect(best.points.map((p) => p.model)).toEqual([
      "claude",
      "gemini",
      "gpt",
    ]);
    const charged =
      rows.reduce((sum, a) => sum + a.costMcr + a.catchUpCostMcr, 0) +
      best.costMcr;
    expect(charged).toBeGreaterThan(0);
    expect(await balanceMcr(db, userId)).toBe(before - charged);
    // Every hold was released: only charges remain.
    const ledger = await ledgerFor(userId);
    const held = ledger
      .filter((e) => e.kind === "reserve" || e.kind === "release")
      .reduce((sum, e) => sum + e.amountMcr, 0);
    expect(held).toBe(0);
    // The merge step's output never reaches an answering model.
    for (const m of ["gpt", "claude", "gemini"] as ModelId[])
      for (const call of calls(m))
        for (const [, text] of call) expect(text).not.toContain(best.intro);
  });

  it("only lets the owner stop a prompt", async () => {
    const owner = await newUser("+8801700000006", 1_000_000);
    const other = await newUser("+8801700000007", 0);
    const s = await sendPrompt(db, owner, {
      text: "Hi",
      mode: "compare",
      models: ["gemini"],
    });
    await expect(stopPrompt(db, other, s.promptId)).rejects.toMatchObject({
      status: 404,
    });
    await s.job;
    const [a] = await db
      .select()
      .from(answers)
      .where(
        and(eq(answers.promptId, s.promptId), eq(answers.model, "gemini")),
      );
    expect(a.status).toBe("done");
  });
});
