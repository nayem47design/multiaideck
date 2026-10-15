import "server-only";

import { and, eq, gte, inArray, lt, sql } from "drizzle-orm";

import type { ModelId } from "@/lib/ai/models";
import type { UsageResponse } from "@/lib/contracts/account";
import type { WalletResponse } from "@/lib/contracts/wallet";
import type { Db } from "@/lib/db";
import {
  answers,
  chats,
  images,
  ledgerEntries,
  prompts,
  users,
} from "@/lib/db/schema";
import { toBalance } from "@/lib/server/users";

import { balanceMcr } from "./ledger";
import { credits, paisaForMcr, bdt } from "./units";

// Spending, read from the ledger: charges (negative) and refunds (positive), joined to the
// answers, prompts and chats they are about. Months are calendar months in Bangladesh time
// (UTC+6, no daylight saving). Read-only: the chat tables are written by the AI orchestrator.

const DHAKA_OFFSET_MS = 6 * 3_600_000;

/** Start (inclusive) and end (exclusive) of a Dhaka calendar month, `offset` months from now. */
export function dhakaMonth(now: Date, offset = 0) {
  const local = new Date(now.getTime() + DHAKA_OFFSET_MS);
  const y = local.getUTCFullYear();
  const m = local.getUTCMonth() + offset;
  const start = new Date(Date.UTC(y, m, 1) - DHAKA_OFFSET_MS);
  const end = new Date(Date.UTC(y, m + 1, 1) - DHAKA_OFFSET_MS);
  return { start, end };
}

/** YYYY-MM-DD of a moment in Dhaka. */
export function dhakaDay(d: Date) {
  return new Date(d.getTime() + DHAKA_OFFSET_MS).toISOString().slice(0, 10);
}

const toCredits = (mcr: number) => Math.round(credits(mcr) * 100) / 100;
const toBdt = (mcr: number) =>
  Math.round(bdt(paisaForMcr(mcr)) * 10000) / 10000;

async function chargesBetween(db: Db, userId: string, start: Date, end: Date) {
  return db
    .select({
      amountMcr: ledgerEntries.amountMcr,
      kind: ledgerEntries.kind,
      refType: ledgerEntries.refType,
      refId: ledgerEntries.refId,
      createdAt: ledgerEntries.createdAt,
    })
    .from(ledgerEntries)
    .where(
      and(
        eq(ledgerEntries.userId, userId),
        inArray(ledgerEntries.kind, ["charge", "refund"]),
        gte(ledgerEntries.createdAt, start),
        lt(ledgerEntries.createdAt, end),
      ),
    );
}

/** GET /api/wallet: balance, plan, this month's spend and chats, average per prompt. */
export async function walletSummary(
  db: Db,
  userId: string,
  now = new Date(),
): Promise<WalletResponse> {
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  const { start, end } = dhakaMonth(now);
  const entries = await chargesBetween(db, userId, start, end);
  const spentMcr = entries
    .filter((e) => e.kind === "charge")
    .reduce((s, e) => s - e.amountMcr, 0);

  const [{ chats: chatCount }] = await db
    .select({ chats: sql<number>`count(distinct ${prompts.chatId})::int` })
    .from(prompts)
    .where(
      and(
        eq(prompts.userId, userId),
        gte(prompts.createdAt, start),
        lt(prompts.createdAt, end),
      ),
    );

  // Average over the last 90 days of answer charges, per prompt that was charged.
  const since = new Date(now.getTime() - 90 * 86_400_000);
  const [avg] = await db
    .select({
      total: sql<string>`coalesce(-sum(${ledgerEntries.amountMcr}), 0)`,
      prompts: sql<number>`count(distinct ${answers.promptId})::int`,
    })
    .from(ledgerEntries)
    .innerJoin(answers, eq(answers.id, ledgerEntries.refId))
    .where(
      and(
        eq(ledgerEntries.userId, userId),
        eq(ledgerEntries.kind, "charge"),
        eq(ledgerEntries.refType, "answer"),
        gte(ledgerEntries.createdAt, since),
      ),
    );

  return {
    balance: toBalance(await balanceMcr(db, userId)),
    plan: user?.plan ?? "payg",
    proRenewsAt: user?.proRenewsAt?.toISOString() ?? null,
    spentThisMonth: toBalance(spentMcr),
    chatsThisMonth: Number(chatCount ?? 0),
    averagePromptCredits:
      avg && avg.prompts > 0
        ? toCredits(Number(avg.total) / avg.prompts)
        : null,
  };
}

type Period = UsageResponse["period"];
type AnswerStatus =
  UsageResponse["activity"][number]["breakdown"][number]["status"];

/** GET /api/usage: spend by model and day, prompts, refunds and per-prompt activity. */
export async function usageReport(
  db: Db,
  userId: string,
  period: Period,
  now = new Date(),
): Promise<UsageResponse> {
  const { start, end } = dhakaMonth(now, period === "last-month" ? -1 : 0);
  const entries = await chargesBetween(db, userId, start, end);
  const charges = entries.filter((e) => e.kind === "charge");
  const spentMcr = charges.reduce((s, e) => s - e.amountMcr, 0);
  const refundedMcr = entries
    .filter((e) => e.kind === "refund")
    .reduce((s, e) => s + e.amountMcr, 0);

  // By model, from this period's answer charges.
  const chargedAnswerIds = charges
    .filter((e) => e.refType === "answer" && e.refId)
    .map((e) => e.refId!);
  const answerModel = new Map<string, ModelId>();
  if (chargedAnswerIds.length) {
    const rows = await db
      .select({ id: answers.id, model: answers.model })
      .from(answers)
      .where(inArray(answers.id, chargedAnswerIds));
    for (const r of rows) answerModel.set(r.id, r.model);
  }
  const byModelMcr = new Map<ModelId, number>();
  for (const e of charges) {
    const model = e.refId ? answerModel.get(e.refId) : undefined;
    if (model)
      byModelMcr.set(model, (byModelMcr.get(model) ?? 0) - e.amountMcr);
  }
  const modelTotal = [...byModelMcr.values()].reduce((a, b) => a + b, 0);
  const byModel = [...byModelMcr.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([model, m]) => ({
      model,
      credits: toCredits(m),
      bdt: toBdt(m),
      share: modelTotal ? m / modelTotal : 0,
    }));

  // Daily, from the first of the month to today (or the month's end).
  const lastDay = dhakaDay(
    new Date(Math.min(now.getTime(), end.getTime() - 1)),
  );
  const perDay = new Map<string, number>();
  for (const e of charges) {
    const d = dhakaDay(e.createdAt);
    perDay.set(d, (perDay.get(d) ?? 0) - e.amountMcr);
  }
  const daily: UsageResponse["daily"] = [];
  for (
    let t = start.getTime();
    dhakaDay(new Date(t)) <= lastDay && t < end.getTime();
    t += 86_400_000
  ) {
    const date = dhakaDay(new Date(t));
    daily.push({ date, credits: toCredits(perDay.get(date) ?? 0) });
  }

  // Activity: prompts asked this period, newest first, with each model's answers and charges.
  const promptRows = await db
    .select({
      id: prompts.id,
      chatId: prompts.chatId,
      mode: prompts.mode,
      models: prompts.models,
      createdAt: prompts.createdAt,
      chat: chats.title,
    })
    .from(prompts)
    .innerJoin(chats, eq(chats.id, prompts.chatId))
    .where(
      and(
        eq(prompts.userId, userId),
        gte(prompts.createdAt, start),
        lt(prompts.createdAt, end),
      ),
    )
    .orderBy(sql`${prompts.createdAt} desc`);

  const promptIds = promptRows.map((p) => p.id);
  const answerRows = promptIds.length
    ? await db
        .select({
          id: answers.id,
          promptId: answers.promptId,
          model: answers.model,
          status: answers.status,
        })
        .from(answers)
        .where(inArray(answers.promptId, promptIds))
    : [];
  const answerIds = answerRows.map((a) => a.id);
  const chargeByAnswer = new Map<string, number>();
  if (answerIds.length) {
    const rows = await db
      .select({
        refId: ledgerEntries.refId,
        amountMcr: ledgerEntries.amountMcr,
      })
      .from(ledgerEntries)
      .where(
        and(
          eq(ledgerEntries.userId, userId),
          eq(ledgerEntries.kind, "charge"),
          eq(ledgerEntries.refType, "answer"),
          inArray(ledgerEntries.refId, answerIds),
        ),
      );
    for (const r of rows)
      chargeByAnswer.set(
        r.refId!,
        (chargeByAnswer.get(r.refId!) ?? 0) - r.amountMcr,
      );
  }

  const activity: UsageResponse["activity"] = promptRows.map((p) => {
    const mine = answerRows.filter((a) => a.promptId === p.id);
    const models: ModelId[] = [];
    for (const m of [...p.models, ...mine.map((a) => a.model)])
      if (!models.includes(m)) models.push(m);
    const breakdown = models
      .filter((m) => mine.some((a) => a.model === m))
      .map((model) => {
        const list = mine.filter((a) => a.model === model);
        const m = list.reduce((s, a) => s + (chargeByAnswer.get(a.id) ?? 0), 0);
        const status: AnswerStatus = list.some((a) => a.status === "done")
          ? "done"
          : list.some((a) => a.status === "failed")
            ? "failed"
            : list.some((a) => a.status === "stopped")
              ? "stopped"
              : "done";
        return { model, credits: toCredits(m), bdt: toBdt(m), status };
      });
    const total = mine.reduce((s, a) => s + (chargeByAnswer.get(a.id) ?? 0), 0);
    return {
      chatId: p.chatId,
      promptId: p.id,
      date: p.createdAt.toISOString(),
      chat: p.chat,
      mode: p.mode,
      models,
      credits: toCredits(total),
      bdt: toBdt(total),
      breakdown,
    };
  });

  // Pictures charged this period (Image studio), as their own rows.
  const imageCharges = charges.filter((e) => e.refType === "image" && e.refId);
  if (imageCharges.length) {
    const rows = await db
      .select({
        id: images.id,
        chatId: images.chatId,
        prompt: images.prompt,
        createdAt: images.createdAt,
      })
      .from(images)
      .where(
        inArray(
          images.id,
          imageCharges.map((e) => e.refId!),
        ),
      );
    for (const img of rows) {
      const m = imageCharges
        .filter((e) => e.refId === img.id)
        .reduce((s, e) => s - e.amountMcr, 0);
      activity.push({
        chatId: img.chatId ?? "",
        promptId: img.id,
        date: img.createdAt.toISOString(),
        chat: img.prompt,
        mode: "image",
        models: [],
        credits: toCredits(m),
        bdt: toBdt(m),
        breakdown: [],
      });
    }
    activity.sort((a, b) => b.date.localeCompare(a.date));
  }

  const promptCount = promptRows.length;
  const answerSpend = activity
    .filter((a) => a.mode !== "image")
    .reduce((s, a) => s + a.credits, 0);
  return {
    period,
    spent: { credits: toCredits(spentMcr), bdt: toBdt(spentMcr) },
    prompts: promptCount,
    chats: new Set(promptRows.map((p) => p.chatId)).size,
    averagePromptCredits: promptCount
      ? Math.round((answerSpend / promptCount) * 100) / 100
      : null,
    byModel,
    daily,
    refundedCredits: toCredits(refundedMcr),
    activity,
  };
}

/** Usage as CSV rows: one line per model per prompt (pictures: one line). */
export function usageCsv(
  report: UsageResponse,
  header: {
    date: string;
    chat: string;
    mode: string;
    model: string;
    credits: string;
    taka: string;
  },
  modeLabel: (mode: string) => string,
  modelName: (model: string) => string,
) {
  const cell = (v: string | number) => `"${String(v).replaceAll('"', '""')}"`;
  const lines = [
    [
      header.date,
      header.chat,
      header.mode,
      header.model,
      header.credits,
      header.taka,
    ],
  ];
  for (const a of report.activity) {
    const mode = modeLabel(a.mode ?? "compare");
    if (!a.breakdown.length)
      lines.push([
        a.date,
        a.chat,
        mode,
        "",
        String(a.credits),
        a.bdt.toFixed(2),
      ]);
    for (const b of a.breakdown)
      lines.push([
        a.date,
        a.chat,
        mode,
        modelName(b.model),
        String(b.credits),
        b.bdt.toFixed(2),
      ]);
  }
  return lines.map((l) => l.map(cell).join(",")).join("\n");
}
