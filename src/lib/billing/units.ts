// Money and credit units. Stored as integers so sums are exact.
//
// - Credits are stored in millicredits (mcr): answers cost fractions of a credit (0.9 cr).
// - Taka are stored in paisa (1 BDT = 100 paisa).
// - 1 credit = BDT 0.01 = 1 paisa, so 1 paisa = 1000 mcr.

export const MCR_PER_CREDIT = 1000;
export const PAISA_PER_BDT = 100;
export const MCR_PER_PAISA = 1000;

export const credits = (mcr: number) => mcr / MCR_PER_CREDIT;
export const mcr = (credits: number) => Math.round(credits * MCR_PER_CREDIT);
export const bdt = (paisa: number) => paisa / PAISA_PER_BDT;
export const paisa = (bdt: number) => Math.round(bdt * PAISA_PER_BDT);

/** Credits worth an amount in BDT, before bonus. */
export const mcrForPaisa = (p: number) => p * MCR_PER_PAISA;
/** BDT value of an amount of credits, in paisa (may be fractional). */
export const paisaForMcr = (m: number) => m / MCR_PER_PAISA;
