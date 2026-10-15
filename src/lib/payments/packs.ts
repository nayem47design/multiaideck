// Top-up packs and Pro, priced in taka. The server computes every credit amount from these;
// the browser only sends a pack id or a custom amount (never credits).
//
// 1 credit = BDT 0.01, so BDT 1 buys 100 credits. Bigger packs add a bonus; custom amounts have
// none. Amounts are integers: paisa and millicredits (src/lib/billing/units.ts).
//
// Pure module (no server imports) so the screens can show the same table before the API answers.

import { credits, mcrForPaisa, paisa } from "@/lib/billing/units";
import type { Pack, PacksResponse } from "@/lib/contracts/wallet";

export interface PackDef {
  id: string;
  bdt: number;
  bonusPercent: number;
  mostChosen?: boolean;
}

/** Figma: Wallet › Top up table (BDT 99 … 2,499, +0 … +20%, "Most chosen" on 699). */
export const PACKS: readonly PackDef[] = [
  { id: "99", bdt: 99, bonusPercent: 0 },
  { id: "399", bdt: 399, bonusPercent: 5 },
  { id: "699", bdt: 699, bonusPercent: 10, mostChosen: true },
  { id: "1299", bdt: 1299, bonusPercent: 15 },
  { id: "2499", bdt: 2499, bonusPercent: 20 },
];

/** Smallest custom amount, BDT (Figma: "Custom amount (from BDT 50)"). */
export const MIN_CUSTOM_BDT = 50;
/** Largest custom amount, BDT: above the biggest pack is the Teams plan ("Need more than…"). */
export const MAX_CUSTOM_BDT = PACKS[PACKS.length - 1].bdt;

/** Pro: BDT 1,599 a month with 159,900 credits granted on each paid month. */
export const PRO = { bdt: 1599, credits: 159_900 } as const;

export interface Quote {
  amountPaisa: number;
  creditsMcr: number;
  bonusMcr: number;
  bonusPercent: number;
}

export class QuoteError extends Error {
  constructor(
    public readonly reason: "unknown_pack" | "too_low" | "too_high" | "invalid",
  ) {
    super(reason);
  }
}

function quoteBdt(bdt: number, bonusPercent: number): Quote {
  const amountPaisa = paisa(bdt);
  const creditsMcr = mcrForPaisa(amountPaisa);
  // Bonus in whole credits, as shown on the table (69,900 × 10% = 6,990).
  const bonusCredits = Math.round((credits(creditsMcr) * bonusPercent) / 100);
  return {
    amountPaisa,
    creditsMcr,
    bonusMcr: bonusCredits * 1000,
    bonusPercent,
  };
}

export function quotePack(packId: string): Quote {
  const pack = PACKS.find((p) => p.id === packId);
  if (!pack) throw new QuoteError("unknown_pack");
  return quoteBdt(pack.bdt, pack.bonusPercent);
}

/** A custom amount in whole taka, MIN_CUSTOM_BDT…MAX_CUSTOM_BDT, without bonus. */
export function quoteCustom(bdt: number): Quote {
  if (!Number.isInteger(bdt)) throw new QuoteError("invalid");
  if (bdt < MIN_CUSTOM_BDT) throw new QuoteError("too_low");
  if (bdt > MAX_CUSTOM_BDT) throw new QuoteError("too_high");
  return quoteBdt(bdt, 0);
}

export function quotePro(): Quote {
  return {
    amountPaisa: paisa(PRO.bdt),
    creditsMcr: PRO.credits * 1000,
    bonusMcr: 0,
    bonusPercent: 0,
  };
}

export function packList(): Pack[] {
  return PACKS.map((p) => {
    const q = quoteBdt(p.bdt, p.bonusPercent);
    return {
      id: p.id,
      bdt: p.bdt,
      credits: credits(q.creditsMcr),
      bonusPercent: p.bonusPercent,
      bonusCredits: credits(q.bonusMcr),
      tag: p.mostChosen ? "most-chosen" : null,
    };
  });
}

export function packsResponse(): PacksResponse {
  return {
    packs: packList(),
    minCustomBdt: MIN_CUSTOM_BDT,
    maxCustomBdt: MAX_CUSTOM_BDT,
    pro: { bdt: PRO.bdt, credits: PRO.credits },
  };
}
