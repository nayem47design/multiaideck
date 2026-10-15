// @vitest-environment node
import { eq } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";

import type { Db } from "@/lib/db";
import { answers, chats, prompts, users } from "@/lib/db/schema";
import { useTestDb } from "@/lib/db/testing";

import { appendEntry, creditPayment, reserve, settle } from "./ledger";
import {
  dhakaDay,
  dhakaMonth,
  usageCsv,
  usageReport,
  walletSummary,
} from "./usage";

let db: Db;
let userId: string;
let promptId: string;

beforeAll(async () => {
  db = await useTestDb();
  [{ id: userId }] = await db
    .insert(users)
    .values({ phone: "+8801700000002" })
    .returning();
  await creditPayment(db, {
    userId,
    paymentId: "seed",
    creditsMcr: 10_000_000,
    bonusMcr: 0,
  });

  // One Compare prompt to three models: GPT 11, Claude 10 credits; Gemini failed (free).
  const [chat] = await db
    .insert(chats)
    .values({ userId, title: "Hellow", kind: "compare" })
    .returning();
  const [prompt] = await db
    .insert(prompts)
    .values({
      chatId: chat.id,
      userId,
      seq: 1,
      text: "Hellow",
      mode: "compare",
      models: ["gpt", "claude", "gemini"],
      status: "done",
    })
    .returning();
  promptId = prompt.id;
  const spec = [
    { model: "gpt", status: "done", cost: 11_000 },
    { model: "claude", status: "done", cost: 10_000 },
    { model: "gemini", status: "failed", cost: 0 },
  ] as const;
  for (const s of spec) {
    const [a] = await db
      .insert(answers)
      .values({
        promptId: prompt.id,
        chatId: chat.id,
        model: s.model,
        modelVersion: "demo",
        status: s.status,
        costMcr: s.cost,
      })
      .returning();
    await reserve(db, { userId, answerId: a.id, amountMcr: 20_000 });
    await settle(db, { userId, answerId: a.id, chargeMcr: s.cost });
  }
  await appendEntry(db, {
    userId,
    kind: "refund",
    amountMcr: 2_000,
    idempotencyKey: "test-refund",
    note: "test",
  });
});

describe("usage", () => {
  it("adds up charges by model, day and prompt from the ledger", async () => {
    const r = await usageReport(db, userId, "this-month");
    expect(r.spent).toEqual({ credits: 21, bdt: 0.21 });
    expect(r.prompts).toBe(1);
    expect(r.chats).toBe(1);
    expect(r.averagePromptCredits).toBe(21);
    expect(r.refundedCredits).toBe(2);
    expect(r.byModel.map((m) => [m.model, m.credits])).toEqual([
      ["gpt", 11],
      ["claude", 10],
    ]);
    expect(r.byModel[0].share).toBeCloseTo(11 / 21);
    expect(r.daily.at(-1)).toEqual({ date: dhakaDay(new Date()), credits: 21 });
    expect(r.daily[0].date.endsWith("-01")).toBe(true);
    expect(r.daily.reduce((s, d) => s + d.credits, 0)).toBe(21);

    expect(r.activity).toHaveLength(1);
    const a = r.activity[0];
    expect(a).toMatchObject({
      promptId,
      chat: "Hellow",
      mode: "compare",
      credits: 21,
    });
    expect(a.models).toEqual(["gpt", "claude", "gemini"]);
    expect(a.breakdown).toEqual([
      { model: "gpt", credits: 11, bdt: 0.11, status: "done" },
      { model: "claude", credits: 10, bdt: 0.1, status: "done" },
      { model: "gemini", credits: 0, bdt: 0, status: "failed" },
    ]);
  });

  it("is empty for last month", async () => {
    const r = await usageReport(db, userId, "last-month");
    expect(r.spent.credits).toBe(0);
    expect(r.activity).toEqual([]);
    expect(r.averagePromptCredits).toBeNull();
  });

  it("summarises the wallet", async () => {
    const w = await walletSummary(db, userId);
    expect(w.balance.credits).toBe(10_000 - 21 + 2);
    expect(w.spentThisMonth).toEqual({ credits: 21, bdt: 0.21 });
    expect(w.chatsThisMonth).toBe(1);
    expect(w.averagePromptCredits).toBe(21);
    const [u] = await db.select().from(users).where(eq(users.id, userId));
    expect(w.plan).toBe(u.plan);
  });

  it("writes CSV lines per model", async () => {
    const r = await usageReport(db, userId, "this-month");
    const csv = usageCsv(
      r,
      {
        date: "Date",
        chat: "Chat",
        mode: "Mode",
        model: "Model",
        credits: "Credits",
        taka: "Taka",
      },
      (m) => m,
      (m) => m.toUpperCase(),
    ).split("\n");
    expect(csv).toHaveLength(4);
    expect(csv[1]).toContain('"GPT","11","0.11"');
  });

  it("uses Dhaka calendar months", () => {
    // 2026-10-31 19:00 UTC is already Nov 1 in Dhaka.
    const { start, end } = dhakaMonth(new Date("2026-10-31T19:00:00Z"));
    expect(start.toISOString()).toBe("2026-10-31T18:00:00.000Z");
    expect(end.toISOString()).toBe("2026-11-30T18:00:00.000Z");
  });
});
