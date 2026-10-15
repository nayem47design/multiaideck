import "server-only";

import { eq, inArray } from "drizzle-orm";

import type { Db } from "@/lib/db";
import { answers, bestAnswers, chats, prompts } from "@/lib/db/schema";
import { COFFEE_CHAT_ID } from "@/lib/mock/chat";
import { DEMO_USER } from "@/lib/mock/demo";

import { COFFEE_STAGES, type CoffeeStage } from "./chats";
import { seedUser } from "./index";

// Screen-test fixture accounts (development only): one per Figma Prototype chat stage, each a
// copy of the demo user whose coffee-shop chat stops at that stage. Signed in through
// POST /api/dev/sign-in-fixture?stage=…; the chat lives at /c/<prefix>coffee-shop-names.
//
// "thinking-*" stages are frozen mid-run, so they're re-created on every sign-in: the chat page
// treats a prompt that stopped moving for a while as orphaned and refunds it.

export { COFFEE_STAGES, type CoffeeStage };

export const fixturePrefix = (stage: CoffeeStage) => `fx-${stage}-`;
export const fixtureChatId = (stage: CoffeeStage) =>
  `${fixturePrefix(stage)}${COFFEE_CHAT_ID}`;

/** +8801300000001… : a valid Bangladesh number per stage, never a real customer's range. */
const phoneFor = (stage: CoffeeStage) =>
  `+88013000000${String(COFFEE_STAGES.indexOf(stage) + 1).padStart(2, "0")}`;

export async function seedFixture(db: Db, stage: CoffeeStage) {
  const prefix = fixturePrefix(stage);
  if (stage.startsWith("thinking-")) await resetCoffeeChat(db, prefix);
  const [local, domain] = DEMO_USER.email.split("@");
  return seedUser(db, {
    phone: phoneFor(stage),
    email: `${local}+${stage}@${domain}`,
    prefix,
    stage,
  });
}

/** Drop the fixture's coffee chat (not the ledger), so a frozen run is seeded fresh. */
async function resetCoffeeChat(db: Db, prefix: string) {
  const chatId = `${prefix}${COFFEE_CHAT_ID}`;
  const ids = (
    await db
      .select({ id: prompts.id })
      .from(prompts)
      .where(eq(prompts.chatId, chatId))
  ).map((p) => p.id);
  if (ids.length) {
    await db.delete(answers).where(inArray(answers.promptId, ids));
    await db.delete(bestAnswers).where(inArray(bestAnswers.promptId, ids));
    await db.delete(prompts).where(eq(prompts.chatId, chatId));
  }
  await db.delete(chats).where(eq(chats.id, chatId));
}
