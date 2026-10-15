// @vitest-environment node
import { eq } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";

import { chatDetail, listChats } from "@/lib/ai/chats";
import { balanceMcr } from "@/lib/billing/ledger";
import type { Db } from "@/lib/db";
import { answers, ledgerEntries, users } from "@/lib/db/schema";
import { useTestDb } from "@/lib/db/testing";

import { seedChats } from "./chats";

let db: Db;
let userId: string;

beforeAll(async () => {
  db = await useTestDb();
  [{ id: userId }] = await db
    .insert(users)
    .values({ phone: "+8801712345214" })
    .returning();
});

describe("demo chats seed", () => {
  it("is idempotent and charges exactly the finished answers", async () => {
    await seedChats(db, userId);
    const once = await db.select().from(ledgerEntries);
    await seedChats(db, userId);
    expect(await db.select().from(ledgerEntries)).toHaveLength(once.length);

    const rows = await db.select().from(answers);
    const charged = rows.reduce(
      (s, a) => s + (a.status === "done" ? a.costMcr + a.catchUpCostMcr : 0),
      0,
    );
    const charges = once
      .filter((e) => e.kind === "charge" && e.refType === "answer")
      .reduce((s, e) => s - e.amountMcr, 0);
    expect(charges).toBe(charged);
    // Failed answers were held and released: net zero.
    for (const a of rows.filter((r) => r.status === "failed"))
      expect(
        once
          .filter((e) => e.refId === a.id)
          .reduce((s, e) => s + e.amountMcr, 0),
      ).toBe(0);
    expect(await balanceMcr(db, userId)).toBeLessThan(0); // spending only; the demo seed tops up after
  });

  it("lists the prototype's chats and the coffee-shop chat in full", async () => {
    const list = await listChats(db, userId);
    expect(list.map((c) => c.id)).toEqual(
      expect.arrayContaining([
        "coffee-shop-names",
        "golpo-coffee-sign",
        "hellow",
        "who-are-you",
        "how-old-are-you",
      ]),
    );
    expect(
      (await listChats(db, userId, { q: "premium" })).map((c) => c.id),
    ).toEqual(["coffee-shop-names"]);
    const coffee = await chatDetail(db, userId, "coffee-shop-names");
    expect(coffee.promptsList).toHaveLength(3);
    const [p1, p2, p3] = coffee.promptsList;
    expect(p1.best?.points).toHaveLength(3);
    expect(p2.answers.map((a) => [a.model, a.status, a.failure])).toEqual([
      ["gpt", "failed", "timeout"],
      ["claude", "done", null],
      ["gemini", "failed", "unavailable"],
      ["gpt", "done", null],
    ]);
    expect(
      p3.answers.filter((a) => a.catchUpCredits > 0).map((a) => a.model),
    ).toEqual(["gpt", "gemini"]);
    const [gpt] = await db
      .select()
      .from(answers)
      .where(eq(answers.id, "coffee-shop-names-p2-gpt-retry"));
    expect(gpt.retryOf).toBe("coffee-shop-names-p2-gpt");
  });
});
