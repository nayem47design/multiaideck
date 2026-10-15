import "server-only";

import { eq } from "drizzle-orm";

import { appendEntry, balanceMcr } from "@/lib/billing/ledger";
import { mcr } from "@/lib/billing/units";
import type { Db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { DEMO_BALANCE, DEMO_USER } from "@/lib/mock/demo";

import { seedChats, type CoffeeStage } from "./chats";
import { seedProjects } from "./projects";
import { seedWallet } from "./wallet";

// Demo data from the Figma prototype (the coffee-shop chat, 10,684 credits), for development,
// e2e and visual tests. Idempotent: running it twice changes nothing. Never runs in production.

/**
 * The demo account's number: the prototype's (fictional) +880 1712 345 214, used by tests.
 * Setting DEMO_PHONE in .env (git-ignored) also seeds a personal copy of the demo data for your
 * own number, with its own ids (prefix "me-"), so you can sign in with it locally.
 */
export const DEMO_PHONE = "+8801712345214";

/** Your own number for a personal copy of the demo data (DEMO_PHONE in .env), if set. */
export const PERSONAL_DEMO_PHONE = normalizeBdPhone(process.env.DEMO_PHONE);

/** "1722 376223", "01722376223" or "+8801722376223" → "+8801722376223"; anything else → undefined. */
function normalizeBdPhone(raw?: string) {
  const d = raw?.replace(/[\s-]/g, "").replace(/^(\+?880|0)/, "");
  return d && /^1[3-9]\d{8}$/.test(d) ? `+880${d}` : undefined;
}

export interface SeedUserOptions {
  phone: string;
  email: string;
  /** Prefix for seeded ids (chats, payments…), so fixture users coexist with the demo user. */
  prefix?: string;
  /** Where the coffee-shop chat stops (see seed/chats.ts). */
  stage?: CoffeeStage;
}

/** A user with the prototype's data: payments, chats, projects and 10,684 credits. */
export async function seedUser(
  db: Db,
  { phone, email, prefix = "", stage }: SeedUserOptions,
) {
  if (process.env.NODE_ENV === "production")
    throw new Error("No demo seed in production");

  let [user] = await db.select().from(users).where(eq(users.phone, phone));
  if (!user)
    [user] = await db
      .insert(users)
      .values({
        phone,
        name: DEMO_USER.name,
        preferredName: DEMO_USER.firstName,
        email,
        emailVerified: true,
      })
      .returning();
  // Users seeded before preferred names existed, or who signed up before being seeded.
  if (!user.preferredName || !user.name)
    [user] = await db
      .update(users)
      .set({
        preferredName: user.preferredName ?? DEMO_USER.firstName,
        name: user.name || DEMO_USER.name,
      })
      .where(eq(users.id, user.id))
      .returning();

  // Area seeds add their history first (payments, chats with charges)…
  await seedWallet(db, user.id, prefix);
  await seedChats(db, user.id, { prefix, stage });
  await seedProjects(db, user.id);

  // …then one adjustment brings the balance to the prototype's 10,684 credits.
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

export async function seedDemo(db: Db) {
  const demo = await seedUser(db, {
    phone: DEMO_PHONE,
    email: DEMO_USER.email,
  });
  if (PERSONAL_DEMO_PHONE && PERSONAL_DEMO_PHONE !== DEMO_PHONE) {
    const [local, domain] = DEMO_USER.email.split("@");
    await seedUser(db, {
      phone: PERSONAL_DEMO_PHONE,
      email: `${local}+me@${domain}`,
      prefix: "me-",
    });
  }
  return demo;
}
