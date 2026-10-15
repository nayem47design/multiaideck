import "server-only";

import type { Db } from "@/lib/db";
import type { users } from "@/lib/db/schema";
import { balanceMcr } from "@/lib/billing/ledger";
import { credits, paisaForMcr, bdt } from "@/lib/billing/units";
import type { Balance, User } from "@/lib/contracts/common";

type UserRow = typeof users.$inferSelect;

/** The API shape of a user (never includes hashes). */
export function toUser(u: UserRow): User {
  return {
    id: u.id,
    name: u.name,
    preferredName: u.preferredName,
    phone: u.phone,
    email: u.email,
    emailVerified: u.emailVerified,
    hasPassword: !!u.passwordHash,
    hasGoogle: !!u.googleSub,
    locale: u.locale,
    answerLanguage: u.answerLanguage,
    plan: u.plan,
    proRenewsAt: u.proRenewsAt?.toISOString() ?? null,
    role: u.role,
    createdAt: u.createdAt.toISOString(),
  };
}

export function toBalance(mcr: number): Balance {
  // Exact to the millicredit (1 mcr = BDT 0.00001); rounding drops float noise like 1.8969999.
  return {
    credits: credits(mcr),
    bdt: Math.round(bdt(paisaForMcr(mcr)) * 100_000) / 100_000,
  };
}

export async function userBalance(db: Db, userId: string): Promise<Balance> {
  return toBalance(await balanceMcr(db, userId));
}
