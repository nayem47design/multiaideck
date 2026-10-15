import "server-only";

import { and, eq, sql } from "drizzle-orm";

import {
  appendEntry,
  balanceMcr,
  InsufficientCreditsError,
} from "@/lib/billing/ledger";
import type { Db } from "@/lib/db";
import { ledgerEntries } from "@/lib/db/schema";

// Reserve-and-settle for spending that isn't one model's answer: the Best answer merge step
// (ref "best_answer", keyed by prompt) and pictures (ref "image"). Same shape as ledger.ts's
// reserve()/settle() for answers, built on appendEntry, so every row is append-only and
// idempotent: reserve:<ref>:<id>, release:<ref>:<id>, charge:<ref>:<id>.

export type HoldRef = "answer" | "best_answer" | "image";

type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];
export type Executor = Db | Tx;

/** Serialises balance-changing work per user inside a transaction (same lock as ledger.ts). */
export async function lockUser(tx: Executor, userId: string) {
  await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${userId}))`);
}

export const reserveKey = (ref: HoldRef, id: string) => `reserve:${ref}:${id}`;

/**
 * Append a hold inside an open transaction that already holds the user's lock. Doesn't check the
 * balance; callers check the total first (see checkBalance).
 */
export async function appendHold(
  tx: Executor,
  {
    userId,
    ref,
    id,
    amountMcr,
  }: { userId: string; ref: HoldRef; id: string; amountMcr: number },
) {
  await appendEntry(tx, {
    userId,
    kind: "reserve",
    amountMcr: -Math.round(amountMcr),
    idempotencyKey: reserveKey(ref, id),
    refType: ref,
    refId: id,
  });
}

/** Throws InsufficientCreditsError when the balance can't cover `neededMcr`. */
export async function checkBalance(
  tx: Executor,
  userId: string,
  neededMcr: number,
) {
  const available = await balanceMcr(tx, userId);
  if (available < neededMcr)
    throw new InsufficientCreditsError(neededMcr, available);
  return available;
}

/** Hold credits for one thing (picture, merge step). Idempotent. */
export async function hold(
  db: Db,
  args: { userId: string; ref: HoldRef; id: string; amountMcr: number },
) {
  return db.transaction(async (tx) => {
    await lockUser(tx, args.userId);
    const [already] = await tx
      .select({ id: ledgerEntries.id })
      .from(ledgerEntries)
      .where(eq(ledgerEntries.idempotencyKey, reserveKey(args.ref, args.id)));
    if (already) return;
    await checkBalance(tx, args.userId, args.amountMcr);
    await appendHold(tx, args);
  });
}

/** Release a hold and charge what it actually cost (0 when it failed or stopped). Idempotent. */
export async function settleHold(
  db: Db,
  {
    userId,
    ref,
    id,
    chargeMcr,
    note,
  }: {
    userId: string;
    ref: HoldRef;
    id: string;
    chargeMcr: number;
    note?: string;
  },
) {
  return db.transaction(async (tx) => {
    await lockUser(tx, userId);
    const [held] = await tx
      .select({ amount: ledgerEntries.amountMcr })
      .from(ledgerEntries)
      .where(
        and(
          eq(ledgerEntries.idempotencyKey, reserveKey(ref, id)),
          eq(ledgerEntries.userId, userId),
        ),
      );
    if (held)
      await appendEntry(tx, {
        userId,
        kind: "release",
        amountMcr: -held.amount,
        idempotencyKey: `release:${ref}:${id}`,
        refType: ref,
        refId: id,
      });
    if (chargeMcr > 0)
      await appendEntry(tx, {
        userId,
        kind: "charge",
        amountMcr: -Math.round(chargeMcr),
        idempotencyKey: `charge:${ref}:${id}`,
        refType: ref,
        refId: id,
        note,
      });
  });
}
