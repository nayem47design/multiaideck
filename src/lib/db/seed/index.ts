import "server-only";

import { eq } from "drizzle-orm";

import { appendEntry } from "@/lib/billing/ledger";
import { mcr } from "@/lib/billing/units";
import type { Db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { DEMO_BALANCE, DEMO_USER } from "@/lib/mock/demo";

import { seedChats } from "./chats";
import { seedWallet } from "./wallet";

// Demo data from the Figma prototype (the coffee-shop chat, 10,684 credits), for development,
// e2e and visual tests. Idempotent: running it twice changes nothing. Never runs in production.

export const DEMO_PHONE = "+8801712345214";

export async function seedDemo(db: Db) {
  if (process.env.NODE_ENV === "production")
    throw new Error("No demo seed in production");

  let [user] = await db.select().from(users).where(eq(users.phone, DEMO_PHONE));
  if (!user)
    [user] = await db
      .insert(users)
      .values({
        phone: DEMO_PHONE,
        name: DEMO_USER.name,
        email: DEMO_USER.email,
        emailVerified: true,
      })
      .returning();

  // Area seeds add their history first (payments, chats with charges)…
  await seedWallet(db, user.id);
  await seedChats(db, user.id);

  // …then one adjustment brings the balance to the prototype's 10,684 credits.
  const { balanceMcr } = await import("@/lib/billing/ledger");
  const diff = mcr(DEMO_BALANCE.credits) - (await balanceMcr(db, user.id));
  if (diff !== 0)
    await appendEntry(db, {
      userId: user.id,
      kind: "adjustment",
      amountMcr: diff,
      // Keyed by the correction, so a seed that adds history later re-balances once.
      idempotencyKey: `seed:demo-balance:${user.id}:${diff}`,
      note: "Demo seed: prototype balance",
    });
  return user;
}
