// @vitest-environment node
import { eq, sql } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";

import type { Db } from "@/lib/db";
import { ledgerEntries, users } from "@/lib/db/schema";
import { useTestDb } from "@/lib/db/testing";

import {
  appendEntry,
  balanceMcr,
  creditPayment,
  InsufficientCreditsError,
  reserve,
  settle,
} from "./ledger";

let db: Db;

// Drizzle wraps database errors; the trigger's message is on the cause.
const appendOnly = (e: unknown) =>
  /append-only/.test(String((e as { cause?: Error }).cause?.message ?? e));
let userId: string;

beforeAll(async () => {
  db = await useTestDb();
  [{ id: userId }] = await db
    .insert(users)
    .values({ phone: "+8801712345214" })
    .returning();
});

describe("credits ledger", () => {
  it("adds a verified payment once, even if the webhook repeats", async () => {
    const args = {
      userId,
      paymentId: "p1",
      creditsMcr: 69_900_000,
      bonusMcr: 6_990_000,
    };
    expect(await creditPayment(db, args)).toBe(true);
    expect(await creditPayment(db, args)).toBe(false);
    expect(await balanceMcr(db, userId)).toBe(76_890_000);
  });

  it("charges only what a finished answer cost, and nothing for a failed one", async () => {
    const before = await balanceMcr(db, userId);
    await reserve(db, { userId, answerId: "a-ok", amountMcr: 2_000 });
    await reserve(db, { userId, answerId: "a-fail", amountMcr: 2_000 });
    expect(await balanceMcr(db, userId)).toBe(before - 4_000);

    await settle(db, { userId, answerId: "a-ok", chargeMcr: 1_400 });
    await settle(db, { userId, answerId: "a-fail", chargeMcr: 0 });
    await settle(db, { userId, answerId: "a-ok", chargeMcr: 1_400 }); // retried: no-op
    expect(await balanceMcr(db, userId)).toBe(before - 1_400);
  });

  it("refuses to reserve more than the balance", async () => {
    const available = await balanceMcr(db, userId);
    await expect(
      reserve(db, { userId, answerId: "too-much", amountMcr: available + 1 }),
    ).rejects.toBeInstanceOf(InsufficientCreditsError);
  });

  it("never lets a row be updated or deleted", async () => {
    await appendEntry(db, {
      userId,
      kind: "adjustment",
      amountMcr: 1,
      idempotencyKey: "adj-1",
      note: "test",
    });
    await expect(
      db
        .update(ledgerEntries)
        .set({ amountMcr: 999 })
        .where(eq(ledgerEntries.idempotencyKey, "adj-1")),
    ).rejects.toSatisfy(appendOnly);
    await expect(
      db.delete(ledgerEntries).where(eq(ledgerEntries.idempotencyKey, "adj-1")),
    ).rejects.toSatisfy(appendOnly);
    await expect(db.execute(sql`truncate ledger_entries`)).rejects.toSatisfy(
      appendOnly,
    );
  });
});
