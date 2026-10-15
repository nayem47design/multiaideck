import "server-only";

import type { Db } from "@/lib/db";
import { payments } from "@/lib/db/schema";
import { quoteCustom, quotePack } from "@/lib/payments/packs";
import { settle } from "@/lib/payments/service";

// Demo payments history. Figma (Wallet › Payments, M36) shows two bKash top-ups that didn't go
// through, ৳199 on Oct 13 and ৳2,499 on Oct 14 ("Failed · not charged"), and a ৳699 bKash
// top-up that was added. Two earlier successful top-ups are seeded too (decided with the product
// owner), dated before the failures so the wallet's "Last: ৳2,499 · not charged" still matches.
// Rows have fixed invoices and go through the real settle(), so running the seed again changes
// nothing; the demo balance is then brought to 10,684 by the adjustment in seed/index.ts.

const HISTORY = [
  {
    invoice: "MAD-DEMO-1002-399",
    pack: "399",
    method: "nagad",
    at: "2026-10-02T21:15:00+06:00",
    status: "paid",
    trxId: "DEMO-NGD-1002",
  },
  {
    invoice: "MAD-DEMO-1012-699",
    pack: "699",
    method: "bkash",
    at: "2026-10-12T11:52:00+06:00",
    status: "paid",
    trxId: "DEMO-BKS-1012",
  },
  {
    invoice: "MAD-DEMO-1013-199",
    bdt: 199,
    method: "bkash",
    at: "2026-10-13T16:32:00+06:00",
    status: "failed",
  },
  {
    invoice: "MAD-DEMO-1014-2499",
    pack: "2499",
    method: "bkash",
    at: "2026-10-14T12:38:00+06:00",
    status: "failed",
  },
] as const;

export async function seedWallet(db: Db, userId: string) {
  for (const h of HISTORY) {
    // ৳199 isn't a pack (Figma's example): a custom amount, no bonus.
    const quote = "pack" in h ? quotePack(h.pack) : quoteCustom(h.bdt);
    const at = new Date(h.at);
    const [row] = await db
      .insert(payments)
      .values({
        userId,
        invoice: h.invoice,
        provider: "sandbox",
        method: h.method,
        kind: "topup",
        amountPaisa: quote.amountPaisa,
        creditsMcr: quote.creditsMcr,
        bonusMcr: quote.bonusMcr,
        createdAt: at,
        updatedAt: at,
      })
      .onConflictDoNothing({ target: payments.invoice })
      .returning();
    if (!row) continue;
    await settle(
      db,
      row.id,
      h.status === "paid"
        ? {
            status: "paid",
            trxId: h.trxId,
            amountPaisa: quote.amountPaisa,
            raw: { seed: true },
          }
        : {
            status: "failed",
            reason: "seed: not approved in bKash",
            raw: { seed: true },
          },
    );
  }
}
