import "server-only";

import { mcrForPaisa, paisa } from "@/lib/billing/units";
import type { Db } from "@/lib/db";
import { payments } from "@/lib/db/schema";
import { settle } from "@/lib/payments/service";

// Demo payments history, as the Figma prototype shows it (Wallet › Payments, M36): two bKash
// top-ups that didn't go through, ৳199 on Oct 13 and ৳2,499 on Oct 14 ("Failed · not charged").
// Figma's table has no successful top-up, so none is seeded; the demo balance comes from the
// adjustment in seed/index.ts. Rows have fixed invoices and go through the real settle(), so
// running the seed again changes nothing. Owned by the wallet work.

const HISTORY = [
  {
    invoice: "MAD-DEMO-1013-199",
    bdt: 199,
    at: "2026-10-13T16:32:00+06:00",
  },
  {
    invoice: "MAD-DEMO-1014-2499",
    bdt: 2499,
    at: "2026-10-14T12:38:00+06:00",
  },
] as const;

export async function seedWallet(db: Db, userId: string) {
  for (const h of HISTORY) {
    const amountPaisa = paisa(h.bdt);
    const at = new Date(h.at);
    const [row] = await db
      .insert(payments)
      .values({
        userId,
        invoice: h.invoice,
        provider: "sandbox",
        method: "bkash",
        kind: "topup",
        amountPaisa,
        creditsMcr: mcrForPaisa(amountPaisa),
        bonusMcr: 0,
        createdAt: at,
        updatedAt: at,
      })
      .onConflictDoNothing({ target: payments.invoice })
      .returning();
    if (row)
      await settle(db, row.id, {
        status: "failed",
        reason: "seed: not approved in bKash",
        raw: { seed: true },
      });
  }
}
