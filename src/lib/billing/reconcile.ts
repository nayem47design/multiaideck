import "server-only";

import { and, eq, gte, inArray, lt } from "drizzle-orm";

import type { Db } from "@/lib/db";
import { ledgerEntries, payments } from "@/lib/db/schema";

import { credits } from "./units";

// Ledger check: every paid payment must have exactly its credits in the ledger (topup or
// pro_grant, plus bonus), and nothing else may credit a payment. Lists every mismatch.
//
// Later (BUILD_GUIDE Phase 8, step 4): a daily job also compares paid payments with PayStation's
// settlement report (amount and trx id per invoice). That report's format isn't known yet; feed
// it into `extra` checks here when it is.

export type MismatchKind =
  | "missing_credit" // paid, but the ledger has less than it should
  | "extra_credit" // the ledger has more for this payment than it should
  | "credited_unpaid" // not paid, but the ledger credits it
  | "unknown_payment" // ledger entry points at a payment that doesn't exist
  | "amount_mismatch"; // provider reported a different amount; left pending for a person

export interface Mismatch {
  kind: MismatchKind;
  paymentId: string;
  userId: string | null;
  invoice: string | null;
  status: string | null;
  expectedCredits: number;
  ledgerCredits: number;
}

export interface ReconcileReport {
  checkedPayments: number;
  checkedEntries: number;
  mismatches: Mismatch[];
}

const PAYMENT_KINDS = ["topup", "bonus", "pro_grant"] as const;

export async function reconcile(
  db: Db,
  range: { from?: Date; to?: Date } = {},
): Promise<ReconcileReport> {
  // The range selects payments (by creation time); their ledger entries may be later.
  const within = [
    range.from && gte(payments.createdAt, range.from),
    range.to && lt(payments.createdAt, range.to),
  ].filter((c) => !!c);

  const rows = await db
    .select()
    .from(payments)
    .where(and(...within));
  const entries = await db
    .select({
      refId: ledgerEntries.refId,
      userId: ledgerEntries.userId,
      amountMcr: ledgerEntries.amountMcr,
    })
    .from(ledgerEntries)
    .where(
      and(
        eq(ledgerEntries.refType, "payment"),
        inArray(ledgerEntries.kind, [...PAYMENT_KINDS]),
      ),
    );

  const ledgerBy = new Map<string, number>();
  for (const e of entries)
    if (e.refId)
      ledgerBy.set(e.refId, (ledgerBy.get(e.refId) ?? 0) + e.amountMcr);

  const mismatches: Mismatch[] = [];
  const known = new Set<string>();
  for (const p of rows) {
    known.add(p.id);
    const expected = p.status === "paid" ? p.creditsMcr + p.bonusMcr : 0;
    const actual = ledgerBy.get(p.id) ?? 0;
    const base = {
      paymentId: p.id,
      userId: p.userId,
      invoice: p.invoice,
      status: p.status,
      expectedCredits: credits(expected),
      ledgerCredits: credits(actual),
    };
    if (p.status !== "paid" && p.failureReason === "amount_mismatch")
      mismatches.push({ kind: "amount_mismatch", ...base });
    if (actual === expected) continue;
    mismatches.push({
      kind:
        p.status !== "paid"
          ? "credited_unpaid"
          : actual < expected
            ? "missing_credit"
            : "extra_credit",
      ...base,
    });
  }

  // Entries for payments outside the range are only reported when the payment doesn't exist.
  const orphanIds = [...ledgerBy.keys()].filter((id) => !known.has(id));
  if (orphanIds.length) {
    const existing = await db
      .select({ id: payments.id })
      .from(payments)
      .where(inArray(payments.id, orphanIds));
    const exists = new Set(existing.map((r) => r.id));
    for (const id of orphanIds)
      if (!exists.has(id))
        mismatches.push({
          kind: "unknown_payment",
          paymentId: id,
          userId: entries.find((e) => e.refId === id)?.userId ?? null,
          invoice: null,
          status: null,
          expectedCredits: 0,
          ledgerCredits: credits(ledgerBy.get(id) ?? 0),
        });
  }

  return {
    checkedPayments: rows.length,
    checkedEntries: entries.length,
    mismatches,
  };
}
