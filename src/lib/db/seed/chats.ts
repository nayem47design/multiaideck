import "server-only";

import { PLACEHOLDER_MEDIA, placeholderPng } from "@/lib/ai/images";
import type { ModelId } from "@/lib/ai/models";
import { appendEntry } from "@/lib/billing/ledger";
import { IMAGE_MCR } from "@/lib/billing/pricing";
import { mcr } from "@/lib/billing/units";
import type { Db } from "@/lib/db";
import { answers, bestAnswers, chats, images, prompts } from "@/lib/db/schema";
import {
  COFFEE_CHAT,
  COFFEE_CHAT_ID,
  simpleChat,
  type DemoAnswer,
  type DemoBestAnswer,
} from "@/lib/mock/chat";
import { DEMO_CHATS } from "@/lib/mock/demo";
import { DEMO_PICTURES } from "@/lib/mock/images";

// The prototype's chats for the demo user, written straight to the database (no model calls), with
// ledger holds, releases and charges that match the answers: finished answers are charged, failed
// ones are held and released (refunded). Stable ids and the ledger's own idempotency keys make it
// idempotent: running it twice changes nothing.
//
//   Coffee shop names  p1 Best answer (3 answers + merge) · p2 GPT-5 timed out (answered later on
//                      retry), Claude answered, Gemini unavailable · p3 to all three, GPT-5 and
//                      Gemini caught up first
//   Hellow · Who are you? · How old are you · Golpo Coffee sign (picture) + three more pictures

type Seeded = DemoAnswer & {
  id: string;
  catchUp?: number;
  retryOf?: string;
  at: Date;
  /** Frozen mid-run (thinking fixtures): the answer's live status and the text so far. */
  live?: { status: "streaming" | "catching-up" | "queued"; text?: string };
};

const DEMO_VERSION = "demo";

function at(dayOffset: number, h: number, m: number, now = new Date()) {
  const d = new Date(now);
  d.setDate(d.getDate() + dayOffset);
  d.setHours(h, m, 0, 0);
  // Never in the future (a seed run early in the morning).
  return d > now ? new Date(now.getTime() - (24 * 60 - h * 60 - m) * 1000) : d;
}
const plus = (d: Date, seconds: number) =>
  new Date(d.getTime() + seconds * 1000);

async function ledgerFor(
  db: Db,
  userId: string,
  ref: "answer" | "best_answer" | "image",
  id: string,
  chargeMcr: number,
  holdMcr: number,
) {
  const base = { userId, refType: ref, refId: id };
  await appendEntry(db, {
    ...base,
    kind: "reserve",
    amountMcr: -holdMcr,
    idempotencyKey: `reserve:${ref}:${id}`,
  });
  await appendEntry(db, {
    ...base,
    kind: "release",
    amountMcr: holdMcr,
    idempotencyKey: `release:${ref}:${id}`,
  });
  if (chargeMcr > 0)
    await appendEntry(db, {
      ...base,
      kind: "charge",
      amountMcr: -chargeMcr,
      idempotencyKey: `charge:${ref}:${id}`,
    });
}

async function seedPrompt(
  db: Db,
  userId: string,
  chatId: string,
  p: {
    id: string;
    seq: number;
    text: string;
    mode: "best" | "compare";
    at: Date;
    answers: Seeded[];
    best?: DemoBestAnswer & { creditsCharged: number };
    /** "running" freezes the prompt mid-answer (thinking fixtures). */
    status?: "running" | "done";
  },
) {
  const models = [
    ...new Set(p.answers.filter((a) => !a.retryOf).map((a) => a.model)),
  ] as ModelId[];
  await db
    .insert(prompts)
    .values({
      id: p.id,
      chatId,
      userId,
      seq: p.seq,
      text: p.text,
      mode: p.mode,
      models,
      status: p.status ?? "done",
      createdAt: p.at,
    })
    .onConflictDoNothing();
  for (const a of p.answers) {
    if (a.live) {
      // Still running: no finish time, no charge yet (its hold stays until it ends).
      await db
        .insert(answers)
        .values({
          id: a.id,
          promptId: p.id,
          chatId,
          model: a.model,
          modelVersion: DEMO_VERSION,
          status: a.live.status,
          text: a.live.text ?? "",
          startedAt: a.at,
          createdAt: a.at,
        })
        .onConflictDoNothing();
      continue;
    }
    const total = a.text ? mcr(a.credits ?? 0) : 0;
    const catchUp = a.text ? mcr(a.catchUp ?? 0) : 0;
    const durationMs = a.text
      ? Math.round((a.seconds ?? 1) * 1000)
      : a.failure === "timeout"
        ? 30_000
        : 300;
    await db
      .insert(answers)
      .values({
        id: a.id,
        promptId: p.id,
        chatId,
        model: a.model,
        modelVersion: DEMO_VERSION,
        status: a.text ? "done" : "failed",
        failure: a.text ? null : (a.failure ?? "error"),
        text: a.text ?? "",
        inputTokens: a.text ? 20 : 0,
        outputTokens: a.text ? (a.tokens ?? 0) : 0,
        catchUpTokens: catchUp ? Math.round(catchUp / 3) : 0,
        costMcr: total - catchUp,
        catchUpCostMcr: catchUp,
        retryOf: a.retryOf ?? null,
        durationMs,
        startedAt: a.at,
        finishedAt: plus(a.at, durationMs / 1000),
        createdAt: a.at,
      })
      .onConflictDoNothing();
    await ledgerFor(
      db,
      userId,
      "answer",
      a.id,
      total,
      Math.max(total, mcr(a.retryCredits ?? 1)) + mcr(5),
    );
  }
  if (p.best) {
    await db
      .insert(bestAnswers)
      .values({
        promptId: p.id,
        status: "done",
        intro: p.best.intro,
        points: p.best.ideas.map((i) => ({
          lead: i.name,
          text: i.text,
          model: i.model,
        })),
        costMcr: mcr(p.best.creditsCharged),
        durationMs: Math.round(p.best.seconds * 1000),
        createdAt: plus(p.at, 3),
      })
      .onConflictDoNothing();
    await ledgerFor(
      db,
      userId,
      "best_answer",
      p.id,
      mcr(p.best.creditsCharged),
      mcr(p.best.creditsCharged + 5),
    );
  }
}

async function seedChat(
  db: Db,
  userId: string,
  c: {
    id: string;
    title: string;
    kind: "best" | "compare" | "image";
    at: Date;
    updatedAt?: Date;
  },
) {
  await db
    .insert(chats)
    .values({
      id: c.id,
      userId,
      title: c.title,
      kind: c.kind,
      createdAt: c.at,
      updatedAt: c.updatedAt ?? c.at,
    })
    .onConflictDoNothing();
}

const title = (id: string) => DEMO_CHATS.find((c) => c.id === id)!.title;

/**
 * How far the coffee-shop chat has got, for the screen-test fixture accounts (seed/fixtures.ts):
 * each stops where a Figma Prototype frame does. "thinking-*" stages are frozen mid-run.
 */
export const COFFEE_STAGES = [
  "thinking-best",
  "best",
  "thinking-compare",
  "compare",
  "thinking-2",
  "prompt-2",
  "prompt-2-retry",
  "thinking-3",
  "prompt-3",
] as const;
export type CoffeeStage = (typeof COFFEE_STAGES)[number];

export interface SeedChatsOptions {
  /** Prefix for every seeded id (chats, prompts, answers, pictures), so several users can coexist. */
  prefix?: string;
  /** Where the coffee-shop chat stops. Default: the full prototype story ("prompt-3"). */
  stage?: CoffeeStage;
  now?: Date;
}

/** Seconds a frozen thinking prompt has been running: past the 8 s "slow" mark. */
const THINKING_FOR = 20;

export async function seedChats(
  db: Db,
  userId: string,
  { prefix = "", stage = "prompt-3", now = new Date() }: SeedChatsOptions = {},
) {
  const P = (id: string) => `${prefix}${id}`;
  const order = COFFEE_STAGES.indexOf(stage);
  const reached = (s: CoffeeStage) => order >= COFFEE_STAGES.indexOf(s);
  const thinking = stage.startsWith("thinking-");
  const askedAt = new Date(now.getTime() - THINKING_FOR * 1000);
  const writing = (text: string) => text.split(" ").slice(0, 8).join(" ");

  // ---- Coffee shop names
  const { p1, p2, p3 } = COFFEE_CHAT.prompts;
  const t1 = thinking && order <= 3 ? askedAt : at(0, 11, 30, now);
  const t2 = stage === "thinking-2" ? askedAt : plus(t1, 4 * 60);
  const t3 = stage === "thinking-3" ? askedAt : plus(t1, 8 * 60);
  const tRetry = plus(t1, 10 * 60);
  const compareFirst = stage === "thinking-compare" || stage === "compare";
  const chatId = P(COFFEE_CHAT_ID);
  await seedChat(db, userId, {
    id: chatId,
    title: title(COFFEE_CHAT_ID),
    kind: compareFirst || reached("prompt-2") ? "compare" : "best",
    at: t1,
    updatedAt: thinking ? askedAt : reached("prompt-2-retry") ? tRetry : t1,
  });
  const id = (p: string, m: string) => `${chatId}-${p}-${m}`;

  // Prompt 1: Best answer (Compare for the compare-first frames). Thinking: Gemini done, the
  // others still writing (Figma "Thinking · Best answer" / "Thinking · Compare").
  const p1Live = stage === "thinking-best" || stage === "thinking-compare";
  await seedPrompt(db, userId, chatId, {
    id: `${chatId}-p1`,
    seq: 1,
    text: p1.text,
    mode: compareFirst ? "compare" : "best",
    at: t1,
    status: p1Live ? "running" : "done",
    answers: p1.answers.map((a) => ({
      ...a,
      id: id("p1", a.model),
      at: t1,
      live:
        p1Live && a.model !== "gemini"
          ? {
              status: "streaming" as const,
              text: a.model === "gpt" ? writing(a.text ?? "") : "",
            }
          : undefined,
    })),
    best:
      compareFirst || p1Live
        ? undefined
        : { ...COFFEE_CHAT.best, creditsCharged: COFFEE_CHAT.best.credits },
  });

  if (reached("thinking-2")) {
    // Prompt 2: GPT-5 times out, Gemini is unavailable. Thinking: GPT-5 slow (no text yet),
    // Claude writing, Gemini not responding (Figma "Thinking · Prompt 2 (2 AIs slow)").
    const p2Live = stage === "thinking-2";
    await seedPrompt(db, userId, chatId, {
      id: `${chatId}-p2`,
      seq: 2,
      text: p2.text,
      mode: "compare",
      at: t2,
      status: p2Live ? "running" : "done",
      answers: [
        ...p2.answers.map((a) => ({
          ...a,
          id: id("p2", a.model),
          at: t2,
          live:
            p2Live && a.model !== "gemini"
              ? {
                  status: "streaming" as const,
                  text: a.model === "claude" ? writing(a.text ?? "") : "",
                }
              : undefined,
        })),
        // GPT-5 answered prompt 2 when it was retried.
        ...(reached("prompt-2-retry") && !(stage === "thinking-3")
          ? [
              {
                ...COFFEE_CHAT.prompts.p2Retried.answers[0],
                id: id("p2", "gpt-retry"),
                retryOf: id("p2", "gpt"),
                at: tRetry,
              },
            ]
          : []),
      ],
    });
  }

  if (reached("thinking-3")) {
    // Prompt 3: GPT-5 and Gemini missed prompt 2, so they read it first (catch-up ≈ 0.5 cr).
    // Thinking: both still catching up, Claude writing (Figma "Thinking · Prompt 3 (catching up)").
    const p3Live = stage === "thinking-3";
    const catchUp: Partial<Record<ModelId, number>> = { gpt: 0.3, gemini: 0.2 };
    await seedPrompt(db, userId, chatId, {
      id: `${chatId}-p3`,
      seq: 3,
      text: p3.text,
      mode: "compare",
      at: t3,
      status: p3Live ? "running" : "done",
      answers: p3.answers.map((a) => ({
        ...a,
        id: id("p3", a.model),
        catchUp: catchUp[a.model],
        at: t3,
        live: p3Live
          ? a.model === "claude"
            ? { status: "streaming" as const, text: writing(a.text ?? "") }
            : { status: "catching-up" as const }
          : undefined,
      })),
    });
  }

  // ---- The one-prompt chats
  const simple: {
    id: "hellow" | "who-are-you" | "how-old-are-you";
    mode: "best" | "compare";
    at: Date;
    bestCredits?: number;
  }[] = [
    { id: "hellow", mode: "best", at: at(0, 9, 12, now), bestCredits: 0.2 },
    { id: "who-are-you", mode: "compare", at: at(-1, 15, 0, now) },
    {
      id: "how-old-are-you",
      mode: "best",
      at: at(-1, 14, 30, now),
      bestCredits: 0,
    },
  ];
  for (const s of simple) {
    const chat = simpleChat(s.id)!;
    await seedChat(db, userId, {
      id: P(s.id),
      title: title(s.id),
      kind: s.mode,
      at: s.at,
    });
    await seedPrompt(db, userId, P(s.id), {
      id: P(`${s.id}-p1`),
      seq: 1,
      text: chat.prompt.text,
      mode: s.mode,
      at: s.at,
      answers: chat.prompt.answers.map((a) => ({
        ...a,
        id: P(`${s.id}-p1-${a.model}`),
        at: s.at,
      })),
      best:
        s.bestCredits !== undefined
          ? { ...chat.best, creditsCharged: s.bestCredits }
          : undefined,
    });
  }

  // ---- Pictures (Golpo Coffee sign is also a chat, as in the prototype's list)
  for (const [i, p] of DEMO_PICTURES.entries()) {
    const when = at(0, 11, 20 - i * 5, now);
    if (i === 0)
      await seedChat(db, userId, {
        id: P(p.id),
        title: p.title,
        kind: "image",
        at: when,
      });
    await db
      .insert(images)
      .values({
        id: P(p.id),
        userId,
        chatId: i === 0 ? P(p.id) : null,
        prompt: p.prompt,
        style: p.style,
        status: "ready",
        data: placeholderPng(p.style, 256).toString("base64"),
        mediaType: PLACEHOLDER_MEDIA,
        costMcr: IMAGE_MCR,
        createdAt: when,
      })
      .onConflictDoNothing();
    await ledgerFor(db, userId, "image", P(p.id), IMAGE_MCR, IMAGE_MCR);
  }
}
