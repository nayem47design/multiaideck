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
  return { credits: credits(mcr), bdt: bdt(paisaForMcr(mcr)) };
}

export async function userBalance(db: Db, userId: string): Promise<Balance> {
  return toBalance(await balanceMcr(db, userId));
}
