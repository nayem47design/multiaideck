import "server-only";

import { and, asc, desc, eq, inArray, isNull, sql } from "drizzle-orm";

import { credits } from "@/lib/billing/units";
import type { ChatDetail, ChatSummary } from "@/lib/contracts/chat";
import type { Db } from "@/lib/db";
import { answers, bestAnswers, chats, images, prompts } from "@/lib/db/schema";
import { ApiError } from "@/lib/server/api";

import { livePrompt } from "./bus";
import type { ModelId } from "./models";
import { toPrompt } from "./views";

// Chats: list (search, kind filter), detail, rename/pin, soft delete.

type ChatRow = typeof chats.$inferSelect;

const LIST_LIMIT = 200;

const like = (q: string) => `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;

export async function listChats(
  db: Db,
  userId: string,
  { q, kind }: { q?: string; kind?: ChatRow["kind"] } = {},
): Promise<ChatSummary[]> {
  const query = q?.trim();
  const pattern = query ? like(query) : null;
  const rows = await db
    .select()
    .from(chats)
    .where(
      and(
        eq(chats.userId, userId),
        isNull(chats.deletedAt),
        kind ? eq(chats.kind, kind) : undefined,
        pattern
          ? sql`(${chats.title} ilike ${pattern}
              or exists (select 1 from ${prompts} where ${prompts.chatId} = ${chats.id} and ${prompts.text} ilike ${pattern})
              or exists (select 1 from ${images} where ${images.chatId} = ${chats.id} and ${images.prompt} ilike ${pattern}))`
          : undefined,
      ),
    )
    .orderBy(desc(chats.updatedAt))
    .limit(LIST_LIMIT);
  return summaries(db, rows, query);
}

async function summaries(
  db: Db,
  rows: ChatRow[],
  query?: string,
): Promise<ChatSummary[]> {
  if (!rows.length) return [];
  const ids = rows.map((c) => c.id);
  const ps = await db
    .select({
      id: prompts.id,
      chatId: prompts.chatId,
      seq: prompts.seq,
      text: prompts.text,
      models: prompts.models,
    })
    .from(prompts)
    .where(inArray(prompts.chatId, ids))
    .orderBy(asc(prompts.seq));
  const answerCost = await db
    .select({
      chatId: answers.chatId,
      mcr: sql<string>`coalesce(sum(${answers.costMcr} + ${answers.catchUpCostMcr}), 0)`,
    })
    .from(answers)
    .where(and(inArray(answers.chatId, ids), eq(answers.status, "done")))
    .groupBy(answers.chatId);
  const bestCost = await db
    .select({
      chatId: prompts.chatId,
      mcr: sql<string>`coalesce(sum(${bestAnswers.costMcr}), 0)`,
    })
    .from(bestAnswers)
    .innerJoin(prompts, eq(prompts.id, bestAnswers.promptId))
    .where(and(inArray(prompts.chatId, ids), eq(bestAnswers.status, "done")))
    .groupBy(prompts.chatId);
  const imageRows = await db
    .select({
      chatId: images.chatId,
      prompt: images.prompt,
      mcr: images.costMcr,
    })
    .from(images)
    .where(inArray(images.chatId, ids));

  const sum = (
    list: { chatId: string | null; mcr: string | number }[],
    id: string,
  ) =>
    list.filter((r) => r.chatId === id).reduce((s, r) => s + Number(r.mcr), 0);

  return rows.map((c) => {
    const own = ps.filter((p) => p.chatId === c.id);
    const pics = imageRows.filter((i) => i.chatId === c.id);
    const models: ModelId[] = [];
    for (const p of own)
      for (const m of p.models) if (!models.includes(m)) models.push(m);
    const texts = own.length
      ? own.map((p) => p.text)
      : pics.map((i) => i.prompt);
    const q = query?.toLowerCase();
    const snippet =
      (q && texts.find((t) => t.toLowerCase().includes(q))) ?? texts[0] ?? "";
    return {
      id: c.id,
      title: c.title,
      kind: c.kind,
      models,
      prompts: own.length || pics.length,
      credits: credits(
        sum(answerCost, c.id) + sum(bestCost, c.id) + sum(pics, c.id),
      ),
      pinned: c.pinned,
      snippet,
      updatedAt: c.updatedAt.toISOString(),
    };
  });
}

async function ownChat(db: Db, userId: string, chatId: string) {
  const [chat] = await db
    .select()
    .from(chats)
    .where(
      and(
        eq(chats.id, chatId),
        eq(chats.userId, userId),
        isNull(chats.deletedAt),
      ),
    );
  if (!chat) throw new ApiError(404, "not_found");
  return chat;
}

export async function chatDetail(
  db: Db,
  userId: string,
  chatId: string,
): Promise<ChatDetail> {
  const chat = await ownChat(db, userId, chatId);
  const [summary] = await summaries(db, [chat]);
  const ps = await db
    .select()
    .from(prompts)
    .where(eq(prompts.chatId, chatId))
    .orderBy(asc(prompts.seq));
  const as = await db.select().from(answers).where(eq(answers.chatId, chatId));
  const bs = ps.length
    ? await db
        .select()
        .from(bestAnswers)
        .where(
          inArray(
            bestAnswers.promptId,
            ps.map((p) => p.id),
          ),
        )
    : [];
  return {
    ...summary,
    promptsList: ps.map((p) =>
      toPrompt(
        p,
        as.filter((a) => a.promptId === p.id),
        bs.find((b) => b.promptId === p.id),
        livePrompt(p.id),
      ),
    ),
  };
}

export async function updateChat(
  db: Db,
  userId: string,
  chatId: string,
  patch: { title?: string; pinned?: boolean },
): Promise<ChatSummary> {
  const chat = await ownChat(db, userId, chatId);
  const [row] = await db
    .update(chats)
    .set({
      ...(patch.title !== undefined ? { title: patch.title } : {}),
      ...(patch.pinned !== undefined ? { pinned: patch.pinned } : {}),
    })
    .where(eq(chats.id, chat.id))
    .returning();
  const [summary] = await summaries(db, [row]);
  return summary;
}

/** Soft delete: the chat disappears; its answers and charges stay for the ledger and usage. */
export async function deleteChat(db: Db, userId: string, chatId: string) {
  const chat = await ownChat(db, userId, chatId);
  await db
    .update(chats)
    .set({ deletedAt: new Date() })
    .where(eq(chats.id, chat.id));
}
