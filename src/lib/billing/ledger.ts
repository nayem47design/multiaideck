import "server-only";

import { and, eq, sql } from "drizzle-orm";

import type { Db } from "@/lib/db";
import { ledgerEntries, type LedgerKind } from "@/lib/db/schema";

// The credits ledger: append-only rows; the balance is their sum. Every write carries an
// idempotency key, so a retried webhook or a double click never moves credits twice.
//
// Spending an answer: reserve the estimate when the prompt starts (negative), then when the
// answer ends release the reserve (positive) and charge the actual cost (negative, zero for
// failed or stopped answers). The user only ever pays for what finished.

export class InsufficientCreditsError extends Error {
  constructor(
    public readonly neededMcr: number,
    public readonly availableMcr: number,
  ) {
    super(
      `Not enough credits: need ${neededMcr} mcr, have ${availableMcr} mcr`,
    );
  }
}

type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];
type Executor = Db | Tx;

export interface NewEntry {
  userId: string;
  kind: LedgerKind;
  amountMcr: number;
  idempotencyKey: string;
  refType?: string;
  refId?: string;
  note?: string;
  createdBy?: string;
}

/** Append one entry. Returns false when an entry with this idempotency key already exists. */
export async function appendEntry(
  db: Executor,
  entry: NewEntry,
): Promise<boolean> {
  if (!Number.isInteger(entry.amountMcr))
    throw new Error("Ledger amounts are whole millicredits");
  const rows = await db
    .insert(ledgerEntries)
    .values(entry)
    .onConflictDoNothing({ target: ledgerEntries.idempotencyKey })
    .returning({ id: ledgerEntries.id });
  return rows.length > 0;
}

export async function balanceMcr(
  db: Executor,
  userId: string,
): Promise<number> {
  const [row] = await db
    .select({
      total: sql<string>`coalesce(sum(${ledgerEntries.amountMcr}), 0)`,
    })
    .from(ledgerEntries)
    .where(eq(ledgerEntries.userId, userId));
  return Number(row?.total ?? 0);
}

/** Serialises balance-changing work per user inside a transaction. */
async function lockUser(tx: Tx, userId: string) {
  await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${userId}))`);
}

/**
 * Hold credits for an answer before calling the model. Throws InsufficientCreditsError when
 * the balance can't cover it. Idempotent per answer.
 */
export async function reserve(
  db: Db,
  {
    userId,
    answerId,
    amountMcr,
  }: { userId: string; answerId: string; amountMcr: number },
) {
  return db.transaction(async (tx) => {
    await lockUser(tx, userId);
    const available = await balanceMcr(tx, userId);
    const already = await tx
      .select({ id: ledgerEntries.id })
      .from(ledgerEntries)
      .where(eq(ledgerEntries.idempotencyKey, `reserve:answer:${answerId}`));
    if (already.length) return;
    if (available < amountMcr)
      throw new InsufficientCreditsError(amountMcr, available);
    await appendEntry(tx, {
      userId,
      kind: "reserve",
      amountMcr: -amountMcr,
      idempotencyKey: `reserve:answer:${answerId}`,
      refType: "answer",
      refId: answerId,
    });
  });
}

/**
 * Close an answer's reserve: release it and charge the actual cost (0 for failed or stopped
 * answers, so they cost nothing). Safe to call twice.
 */
export async function settle(
  db: Db,
  {
    userId,
    answerId,
    chargeMcr,
    note,
  }: { userId: string; answerId: string; chargeMcr: number; note?: string },
) {
  return db.transaction(async (tx) => {
    await lockUser(tx, userId);
    const [held] = await tx
      .select({ amount: ledgerEntries.amountMcr })
      .from(ledgerEntries)
      .where(
        and(
          eq(ledgerEntries.idempotencyKey, `reserve:answer:${answerId}`),
          eq(ledgerEntries.userId, userId),
        ),
      );
    if (held)
      await appendEntry(tx, {
        userId,
        kind: "release",
        amountMcr: -held.amount,
        idempotencyKey: `release:answer:${answerId}`,
        refType: "answer",
        refId: answerId,
      });
    if (chargeMcr > 0)
      await appendEntry(tx, {
        userId,
        kind: "charge",
        amountMcr: -Math.round(chargeMcr),
        idempotencyKey: `charge:answer:${answerId}`,
        refType: "answer",
        refId: answerId,
        note,
      });
  });
}

/** Credit a verified payment (top-up + bonus). Idempotent per payment. */
export async function creditPayment(
  db: Executor,
  {
    userId,
    paymentId,
    creditsMcr,
    bonusMcr,
    kind = "topup",
  }: {
    userId: string;
    paymentId: string;
    creditsMcr: number;
    bonusMcr: number;
    kind?: "topup" | "pro_grant";
  },
) {
  const added = await appendEntry(db, {
    userId,
    kind,
    amountMcr: creditsMcr,
    idempotencyKey: `${kind}:payment:${paymentId}`,
    refType: "payment",
    refId: paymentId,
  });
  if (bonusMcr > 0)
    await appendEntry(db, {
      userId,
      kind: "bonus",
      amountMcr: bonusMcr,
      idempotencyKey: `bonus:payment:${paymentId}`,
      refType: "payment",
      refId: paymentId,
    });
  return added;
}
