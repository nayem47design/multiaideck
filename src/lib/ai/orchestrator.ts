import "server-only";

import { streamText } from "ai";
import { and, asc, eq, inArray, isNull, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";

import { InsufficientCreditsError, settle } from "@/lib/billing/ledger";
import {
  answerCostMcr,
  answerReserveMcr,
  catchUpCostMcr,
  MAX_OUTPUT_TOKENS,
  mergeCostMcr,
  mergeReserveMcr,
  tokensOf,
} from "@/lib/billing/pricing";
import { credits } from "@/lib/billing/units";
import type { Mode, Prompt } from "@/lib/contracts/chat";
import type { Db } from "@/lib/db";
import { answers, bestAnswers, chats, prompts } from "@/lib/db/schema";
import { ApiError } from "@/lib/server/api";
import { userBalance } from "@/lib/server/users";

import {
  bus,
  closeLivePrompt,
  livePrompt,
  openLivePrompt,
  type LiveAnswer,
  type LivePrompt,
} from "./bus";
import type { DemoCallOptions } from "./demo";
import { buildHistory, INSTRUCTIONS, type History } from "./history";
import { appendHold, checkBalance, lockUser, settleHold } from "./holds";
import { merge } from "./merge";
import type { ModelId } from "./models";
import { resolveModel, type ResolvedModel } from "./providers";
import { titleFromPrompt } from "./titles";
import { toAnswer, toPrompt, type AnswerRow, type PromptRow } from "./views";

// The orchestrator: asks every chosen model in parallel and keeps the promises on screen.
//
//  - Independent answers (rule 7): each model's messages come from buildHistory(): the user's
//    prompts and that model's own earlier answers, never another model's (history.ts).
//  - Catch-up: a recipient that missed earlier prompts gets them first ("catching-up"); that part
//    of the cost is stored apart (answers.catch_up_cost_mcr).
//  - Credits: every answer's cap is reserved up front, all or nothing (402 and nothing created);
//    each answer settles with its actual cost when done, 0 when it failed or was stopped.
//  - Timeouts: 30 s per model ("timeout"); provider refusals → "unavailable"; others → "error".
//  - Best answer: a separate merge step after the answers (merge.ts), on its own hold.
//  - The work outlives the request: it starts here and the route keeps it alive with after();
//    progress goes to the in-process bus (bus.ts) and to the database every FLUSH_MS, so a client
//    that reconnects gets a fresh snapshot.

/** A model that hasn't finished in 30 s fails with "timeout" (and costs nothing). */
export const MODEL_TIMEOUT_MS = 30_000;
/**
 * The demo model's timeout is shorter so the prototype's timeout state is quick to reproduce in
 * development and e2e (cue "#timeout"). Real providers always get MODEL_TIMEOUT_MS.
 */
export const DEMO_TIMEOUT_MS = 8_000;
/** How often streamed text is written to the database. */
const FLUSH_MS = 500;
/** A "running" prompt with no live run this long after its last answer started was orphaned. */
const STALE_MS = 90_000;

const TERMINAL = new Set(["done", "failed", "stopped"]);

export interface OrchestratorDeps {
  resolveModel: (id: ModelId) => ResolvedModel;
  /** Overrides both timeouts (tests). */
  timeoutMs?: number;
  /** Use the demo merge even when a provider key is set (tests). */
  demoMerge?: boolean;
}

const defaults: OrchestratorDeps = { resolveModel };
let deps: OrchestratorDeps = defaults;

/** Tests: swap the model registry or timeouts. Returns a function that restores the defaults. */
export function setOrchestratorDeps(partial: Partial<OrchestratorDeps>) {
  deps = { ...defaults, ...partial };
  return () => {
    deps = defaults;
  };
}

// ---- Loading

async function chatForUser(db: Db, userId: string, chatId: string) {
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
  if (!chat || chat.kind === "image") throw new ApiError(404, "not_found");
  return chat;
}

async function chatContents(db: Db, chatId: string) {
  const ps = await db
    .select()
    .from(prompts)
    .where(eq(prompts.chatId, chatId))
    .orderBy(asc(prompts.seq));
  const as = await db
    .select()
    .from(answers)
    .where(eq(answers.chatId, chatId))
    .orderBy(asc(answers.createdAt));
  return { prompts: ps, answers: as };
}

/** The prompt and its chat, if the user owns them. */
export async function promptForUser(db: Db, userId: string, promptId: string) {
  const [row] = await db
    .select({ prompt: prompts, chat: chats })
    .from(prompts)
    .innerJoin(chats, eq(chats.id, prompts.chatId))
    .where(
      and(
        eq(prompts.id, promptId),
        eq(chats.userId, userId),
        isNull(chats.deletedAt),
      ),
    );
  if (!row) throw new ApiError(404, "not_found");
  return row;
}

async function answerForUser(db: Db, userId: string, answerId: string) {
  const [row] = await db
    .select({ answer: answers, prompt: prompts, chat: chats })
    .from(answers)
    .innerJoin(prompts, eq(prompts.id, answers.promptId))
    .innerJoin(chats, eq(chats.id, answers.chatId))
    .where(
      and(
        eq(answers.id, answerId),
        eq(chats.userId, userId),
        isNull(chats.deletedAt),
      ),
    );
  if (!row) throw new ApiError(404, "not_found");
  return row;
}

// ---- Planning: what each model is sent and what to hold for it

interface Plan {
  answerId: string;
  model: ModelId;
  history: History;
  resolved: ResolvedModel;
  reserveMcr: number;
}

function planFor(
  model: ModelId,
  current: { seq: number; text: string },
  contents: { prompts: PromptRow[]; answers: AnswerRow[] },
): Plan {
  const history = buildHistory(
    model,
    current,
    contents.prompts,
    contents.answers,
  );
  const resolved = deps.resolveModel(model);
  return {
    answerId: randomUUID(),
    model,
    history,
    resolved,
    // An unavailable model fails at once: nothing to hold.
    reserveMcr:
      resolved.kind === "unavailable"
        ? 0
        : answerReserveMcr(model, history.inputTokens),
  };
}

function insufficient(e: InsufficientCreditsError) {
  return new ApiError(402, "insufficient_credits", "Not enough credits", {
    neededCredits: credits(e.neededMcr),
    availableCredits: credits(e.availableMcr),
  });
}

const unique = <T>(list: T[]) => [...new Set(list)];

// ---- Send a prompt (new chat or follow-up)

export interface SendInput {
  chatId?: string;
  text: string;
  mode: Mode;
  models: ModelId[];
  attachments?: { name: string; kind: "file" | "image"; size: number }[];
  /** Follow-ups: which models get it (defaults to `models`). */
  recipients?: ModelId[];
}

export interface Started {
  chatId: string;
  promptId: string;
  reservedMcr: number;
  /** The run; the route keeps it alive with after(). Never rejects. */
  job: Promise<void>;
}

export async function sendPrompt(
  db: Db,
  userId: string,
  input: SendInput,
): Promise<Started> {
  const existing = input.chatId
    ? await chatForUser(db, userId, input.chatId)
    : null;
  const contents = existing
    ? await chatContents(db, existing.id)
    : { prompts: [], answers: [] };
  const seq = (contents.prompts.at(-1)?.seq ?? 0) + 1;
  const recipients = unique(input.recipients ?? input.models);
  const plans = recipients.map((m) =>
    planFor(m, { seq, text: input.text }, contents),
  );
  const best = input.mode === "best";
  const mergeHold = best
    ? mergeReserveMcr(tokensOf(input.text), plans.length)
    : 0;
  const total = plans.reduce((s, p) => s + p.reserveMcr, 0) + mergeHold;

  const chatId = existing?.id ?? randomUUID();
  const promptId = randomUUID();
  try {
    await db.transaction(async (tx) => {
      await lockUser(tx, userId);
      await checkBalance(tx, userId, total);
      if (!existing)
        await tx.insert(chats).values({
          id: chatId,
          userId,
          title: titleFromPrompt(input.text),
          kind: input.mode,
        });
      else
        await tx
          .update(chats)
          .set({ updatedAt: new Date() })
          .where(eq(chats.id, chatId));
      await tx.insert(prompts).values({
        id: promptId,
        chatId,
        userId,
        seq,
        text: input.text,
        mode: input.mode,
        models: recipients,
        attachments: input.attachments ?? [],
      });
      for (const p of plans) {
        await tx.insert(answers).values({
          id: p.answerId,
          promptId,
          chatId,
          model: p.model,
          modelVersion: p.resolved.version,
          catchUpTokens: p.history.catchUpTokens,
        });
        if (p.reserveMcr)
          await appendHold(tx, {
            userId,
            ref: "answer",
            id: p.answerId,
            amountMcr: p.reserveMcr,
          });
      }
      if (best) {
        await tx.insert(bestAnswers).values({ promptId });
        await appendHold(tx, {
          userId,
          ref: "best_answer",
          id: promptId,
          amountMcr: mergeHold,
        });
      }
    });
  } catch (e) {
    if (e instanceof InsufficientCreditsError) throw insufficient(e);
    throw e;
  }

  const job = run(db, {
    userId,
    promptId,
    promptText: input.text,
    plans,
    retry: false,
    merge: best ? { reserveMcr: mergeHold } : null,
  });
  return { chatId, promptId, reservedMcr: total, job };
}

// ---- Retry and swap: a new answer for the same prompt

export async function retryAnswer(db: Db, userId: string, answerId: string) {
  const { answer } = await answerForUser(db, userId, answerId);
  return askAgain(db, userId, answer, answer.model);
}

export async function swapAnswer(
  db: Db,
  userId: string,
  answerId: string,
  model: ModelId,
) {
  const { answer } = await answerForUser(db, userId, answerId);
  if (model === answer.model)
    throw new ApiError(400, "invalid_input", "Pick a different model");
  return askAgain(db, userId, answer, model);
}

async function askAgain(
  db: Db,
  userId: string,
  old: AnswerRow,
  model: ModelId,
): Promise<Started> {
  if (
    old.status !== "failed" &&
    old.status !== "stopped" &&
    model === old.model
  )
    throw new ApiError(
      409,
      "conflict",
      "Only a failed or stopped answer can be retried",
    );
  const contents = await chatContents(db, old.chatId);
  const prompt = contents.prompts.find((p) => p.id === old.promptId)!;
  if (contents.answers.some((a) => a.retryOf === old.id))
    throw new ApiError(409, "conflict", "Already retried");
  if (
    model !== old.model &&
    contents.answers.some(
      (a) =>
        a.promptId === prompt.id &&
        a.model === model &&
        a.status !== "failed" &&
        a.status !== "stopped",
    )
  )
    throw new ApiError(409, "conflict", "That model already answered");

  const plan = planFor(model, prompt, contents);
  try {
    await db.transaction(async (tx) => {
      await lockUser(tx, userId);
      await checkBalance(tx, userId, plan.reserveMcr);
      await tx.insert(answers).values({
        id: plan.answerId,
        promptId: prompt.id,
        chatId: old.chatId,
        model,
        modelVersion: plan.resolved.version,
        catchUpTokens: plan.history.catchUpTokens,
        retryOf: old.id,
      });
      if (plan.reserveMcr)
        await appendHold(tx, {
          userId,
          ref: "answer",
          id: plan.answerId,
          amountMcr: plan.reserveMcr,
        });
      // A swap takes the old model's place in the prompt's order.
      const models =
        model === old.model || prompt.models.includes(model)
          ? prompt.models
          : prompt.models.map((m) => (m === old.model ? model : m));
      await tx
        .update(prompts)
        .set({ status: "running", models })
        .where(eq(prompts.id, prompt.id));
      await tx
        .update(chats)
        .set({ updatedAt: new Date() })
        .where(eq(chats.id, old.chatId));
    });
  } catch (e) {
    if (e instanceof InsufficientCreditsError) throw insufficient(e);
    throw e;
  }
  const job = run(db, {
    userId,
    promptId: prompt.id,
    promptText: prompt.text,
    plans: [plan],
    retry: true,
    merge: null,
  });
  return {
    chatId: old.chatId,
    promptId: prompt.id,
    reservedMcr: plan.reserveMcr,
    job,
  };
}

// ---- Running

interface RunArgs {
  userId: string;
  promptId: string;
  promptText: string;
  plans: Plan[];
  retry: boolean;
  merge: { reserveMcr: number } | null;
}

async function run(db: Db, args: RunArgs) {
  const live = openLivePrompt(args.promptId);
  for (const p of args.plans)
    live.answers.set(p.answerId, {
      status: "queued",
      failure: null,
      text: "",
      controller: new AbortController(),
    });
  try {
    await Promise.all(
      args.plans.map((p) =>
        runAnswer(db, live, args, p).catch((e) =>
          console.error("[orchestrator] answer", p.answerId, e),
        ),
      ),
    );
    if (args.merge)
      await runMerge(db, live, args, args.merge.reserveMcr).catch((e) =>
        console.error("[orchestrator] merge", args.promptId, e),
      );
  } finally {
    try {
      await finishPrompt(db, args.promptId, live);
      const balance = await userBalance(db, args.userId);
      bus().publish(args.promptId, { type: "done", balance: balance.credits });
    } catch (e) {
      console.error("[orchestrator] finish", args.promptId, e);
    }
    closeLivePrompt(args.promptId);
  }
}

function timeoutFor(resolved: ResolvedModel) {
  return (
    deps.timeoutMs ??
    (resolved.kind === "demo" ? DEMO_TIMEOUT_MS : MODEL_TIMEOUT_MS)
  );
}

/** Provider refusals (outage, overload, rate limit) are "unavailable"; anything else "error". */
function failureOf(e: unknown): "unavailable" | "error" {
  const status =
    (e as { statusCode?: number })?.statusCode ??
    (e as { cause?: { statusCode?: number } })?.cause?.statusCode;
  if (status && (status >= 500 || status === 429 || status === 408))
    return "unavailable";
  if (/unavailable|overloaded|ECONNREFUSED|ENOTFOUND/i.test(String(e)))
    return "unavailable";
  return "error";
}

async function runAnswer(db: Db, live: LivePrompt, args: RunArgs, plan: Plan) {
  const la = live.answers.get(plan.answerId)!;
  const { promptId } = args;
  const publishStatus = (
    s: LiveAnswer["status"],
    f: LiveAnswer["failure"] = null,
  ) => {
    la.status = s;
    la.failure = f;
    bus().publish(promptId, {
      type: "answer-status",
      answerId: plan.answerId,
      status: s,
      failure: f,
    });
  };

  const startedAt = new Date();
  let usage: { inputTokens?: number; outputTokens?: number } | null = null;
  let error: unknown = null;

  if (plan.resolved.kind === "unavailable") {
    error = Object.assign(new Error("No provider for this model"), {
      statusCode: 503,
    });
  } else if (!la.controller.signal.aborted) {
    const model = plan.resolved.model;
    publishStatus(plan.history.missed ? "catching-up" : "streaming");
    await db
      .update(answers)
      .set({ status: la.status, startedAt })
      .where(eq(answers.id, plan.answerId));

    const timer = setTimeout(
      () => la.controller.abort("timeout"),
      timeoutFor(plan.resolved),
    );
    let dirty = false;
    let flushing: Promise<unknown> = Promise.resolve();
    const flush = () => {
      if (!dirty) return;
      dirty = false;
      const text = la.text;
      const status = la.status;
      flushing = flushing.then(() =>
        db
          .update(answers)
          .set({ text, status })
          .where(
            and(
              eq(answers.id, plan.answerId),
              inArray(answers.status, ["queued", "catching-up", "streaming"]),
            ),
          )
          .catch(() => {}),
      );
    };
    const flusher = setInterval(flush, FLUSH_MS);
    try {
      const demo: DemoCallOptions = {
        retry: args.retry,
        catchUpPrompts: plan.history.missed,
      };
      const result = streamText({
        model,
        instructions: INSTRUCTIONS,
        messages: plan.history.messages,
        maxOutputTokens: MAX_OUTPUT_TOKENS,
        abortSignal: la.controller.signal,
        maxRetries: 1,
        ...(plan.resolved.kind === "demo"
          ? { providerOptions: { demo: { ...demo } } }
          : {}),
      });
      for await (const part of result.stream) {
        if (part.type === "text-delta") {
          if (!part.text) continue;
          if (la.status !== "streaming") publishStatus("streaming");
          la.text += part.text;
          dirty = true;
          bus().publish(promptId, {
            type: "answer-delta",
            answerId: plan.answerId,
            delta: part.text,
          });
        } else if (part.type === "error") {
          error = part.error;
          break;
        } else if (part.type === "finish") {
          usage = part.totalUsage;
        } else if (part.type === "abort") {
          break;
        }
      }
    } catch (e) {
      error = e;
    } finally {
      clearTimeout(timer);
      clearInterval(flusher);
      await flushing;
    }
  }

  // ---- Outcome
  const reason = la.controller.signal.aborted
    ? la.controller.signal.reason
    : null;
  let status: "done" | "failed" | "stopped";
  let failure: "timeout" | "unavailable" | "error" | "stopped" | null = null;
  if (reason === "stop") [status, failure] = ["stopped", "stopped"];
  else if (reason === "timeout") [status, failure] = ["failed", "timeout"];
  else if (error) [status, failure] = ["failed", failureOf(error)];
  else if (usage) status = "done";
  else [status, failure] = ["failed", "error"];

  let inputTokens = 0;
  let outputTokens = 0;
  let costMcr = 0;
  let catchUpMcr = 0;
  if (status === "done") {
    inputTokens = usage?.inputTokens ?? plan.history.inputTokens;
    outputTokens = usage?.outputTokens ?? tokensOf(la.text);
    // Never more than what was held.
    const total = Math.min(
      answerCostMcr(plan.model, inputTokens, outputTokens),
      plan.reserveMcr,
    );
    catchUpMcr = Math.min(
      catchUpCostMcr(plan.model, plan.history.catchUpTokens),
      total,
    );
    costMcr = total - catchUpMcr;
  }
  const finishedAt = new Date();
  const [row] = await db
    .update(answers)
    .set({
      status,
      failure,
      text: la.text,
      inputTokens,
      outputTokens,
      costMcr,
      catchUpCostMcr: catchUpMcr,
      durationMs: finishedAt.getTime() - startedAt.getTime(),
      startedAt,
      finishedAt,
    })
    .where(eq(answers.id, plan.answerId))
    .returning();
  await settle(db, {
    userId: args.userId,
    answerId: plan.answerId,
    chargeMcr: costMcr + catchUpMcr,
  });
  la.status = status;
  la.failure = failure;
  bus().publish(promptId, { type: "answer-done", answer: toAnswer(row) });
}

async function runMerge(
  db: Db,
  live: LivePrompt,
  args: RunArgs,
  reserveMcr: number,
) {
  const { promptId, userId } = args;
  const done = (
    await db
      .select()
      .from(answers)
      .where(and(eq(answers.promptId, promptId), eq(answers.status, "done")))
      .orderBy(asc(answers.createdAt))
  ).filter(
    // The latest finished answer per model.
    (a, i, all) => !all.slice(i + 1).some((b) => b.model === a.model),
  );

  const started = Date.now();
  const fail = async () => {
    const [row] = await db
      .update(bestAnswers)
      .set({ status: "failed", durationMs: Date.now() - started })
      .where(eq(bestAnswers.promptId, promptId))
      .returning();
    await settleHold(db, {
      userId,
      ref: "best_answer",
      id: promptId,
      chargeMcr: 0,
    });
    live.best = undefined;
    bus().publish(promptId, {
      type: "best-done",
      best: {
        status: "failed",
        intro: row?.intro ?? "",
        points: row?.points ?? [],
        credits: 0,
        durationMs: row?.durationMs ?? null,
      },
    });
  };
  if (live.stopRequested || !done.length) return fail();

  const controller = new AbortController();
  live.mergeController = controller;
  try {
    const result = await merge(
      {
        prompt: args.promptText,
        answers: done.map((a) => ({ model: a.model, text: a.text })),
      },
      {
        signal: controller.signal,
        useDemo: deps.demoMerge,
        onPoint: ({ intro, points }) => {
          live.best = {
            status: "streaming",
            intro,
            points,
            credits: 0,
            durationMs: null,
          };
          bus().publish(promptId, { type: "best-delta", best: live.best });
        },
      },
    );
    const cost = Math.min(
      mergeCostMcr(result.inputTokens, result.outputTokens),
      reserveMcr,
    );
    const durationMs = Date.now() - started;
    await db
      .update(bestAnswers)
      .set({
        status: "done",
        intro: result.intro,
        points: result.points,
        costMcr: cost,
        durationMs,
      })
      .where(eq(bestAnswers.promptId, promptId));
    await settleHold(db, {
      userId,
      ref: "best_answer",
      id: promptId,
      chargeMcr: cost,
    });
    live.best = undefined;
    bus().publish(promptId, {
      type: "best-done",
      best: {
        status: "done",
        intro: result.intro,
        points: result.points,
        credits: credits(cost),
        durationMs,
      },
    });
  } catch (e) {
    if (!controller.signal.aborted) console.error("[orchestrator] merge", e);
    await fail();
  } finally {
    live.mergeController = undefined;
  }
}

/** Sets the prompt's status once every answer has ended. */
async function finishPrompt(db: Db, promptId: string, live?: LivePrompt) {
  const rows = await db
    .select({ status: answers.status })
    .from(answers)
    .where(eq(answers.promptId, promptId));
  if (rows.some((r) => !TERMINAL.has(r.status))) return;
  const [best] = await db
    .select({ status: bestAnswers.status })
    .from(bestAnswers)
    .where(eq(bestAnswers.promptId, promptId));
  if (best?.status === "streaming") return;
  await db
    .update(prompts)
    .set({ status: live?.stopRequested ? "stopped" : "done" })
    .where(eq(prompts.id, promptId));
}

// ---- Stop

/** Stops the prompt's unfinished answers (and its merge step). They cost nothing. */
export async function stopPrompt(db: Db, userId: string, promptId: string) {
  await promptForUser(db, userId, promptId);
  const live = livePrompt(promptId);
  if (live && !live.finished) {
    live.stopRequested = true;
    for (const a of live.answers.values())
      if (!TERMINAL.has(a.status)) a.controller.abort("stop");
    live.mergeController?.abort("stop");
    return;
  }
  // Not running in this process (restarted server, another instance): close it in the database.
  await closeOrphan(db, userId, promptId, "stopped");
}

/** Ends answers that no process is running any more, refunding them. */
async function closeOrphan(
  db: Db,
  userId: string,
  promptId: string,
  as: "stopped" | "failed",
) {
  const open = await db
    .select()
    .from(answers)
    .where(
      and(
        eq(answers.promptId, promptId),
        inArray(answers.status, ["queued", "catching-up", "streaming"]),
      ),
    );
  for (const a of open) {
    await db
      .update(answers)
      .set({
        status: as,
        failure: as === "stopped" ? "stopped" : "error",
        finishedAt: new Date(),
      })
      .where(eq(answers.id, a.id));
    await settle(db, { userId, answerId: a.id, chargeMcr: 0 });
  }
  const [best] = await db
    .update(bestAnswers)
    .set({ status: "failed" })
    .where(
      and(
        eq(bestAnswers.promptId, promptId),
        eq(bestAnswers.status, "streaming"),
      ),
    )
    .returning();
  if (best)
    await settleHold(db, {
      userId,
      ref: "best_answer",
      id: promptId,
      chargeMcr: 0,
    });
  await db
    .update(prompts)
    .set({ status: as === "stopped" ? "stopped" : "done" })
    .where(and(eq(prompts.id, promptId), eq(prompts.status, "running")));
}

// ---- Snapshots (for the stream and the chat page)

export async function promptSnapshot(
  db: Db,
  userId: string,
  promptId: string,
): Promise<{ prompt: Prompt; seq: number }> {
  let { prompt } = await promptForUser(db, userId, promptId);
  let live = livePrompt(promptId);
  if (prompt.status === "running" && !live) {
    const [latest] = await db
      .select({ at: sql<Date>`max(${answers.createdAt})` })
      .from(answers)
      .where(eq(answers.promptId, promptId));
    const at = latest?.at ? new Date(latest.at).getTime() : 0;
    if (Date.now() - at > STALE_MS) {
      await closeOrphan(db, userId, promptId, "failed");
      ({ prompt } = await promptForUser(db, userId, promptId));
      live = undefined;
    }
  }
  // Read the database first, then overlay the live state (which is ahead of it). The stream route
  // subscribes before calling this and drops buffered events numbered up to `seq`.
  const as = await db
    .select()
    .from(answers)
    .where(eq(answers.promptId, promptId));
  const [best] = await db
    .select()
    .from(bestAnswers)
    .where(eq(bestAnswers.promptId, promptId));
  const [fresh] = await db
    .select()
    .from(prompts)
    .where(eq(prompts.id, promptId));
  // `seq` is read in the same tick as the live overlay: events numbered after it are news.
  return {
    prompt: toPrompt(fresh ?? prompt, as, best, livePrompt(promptId)),
    seq: bus().seq(),
  };
}

/** Whether this process is running (or just ran) the prompt. */
export const isLive = (promptId: string) => {
  const l = livePrompt(promptId);
  return !!l && !l.finished;
};

// ---- Estimates

export async function estimateFor(
  db: Db,
  userId: string,
  input: { text: string; mode: Mode; models: ModelId[]; chatId?: string },
) {
  const contents = input.chatId
    ? await chatContents(db, (await chatForUser(db, userId, input.chatId)).id)
    : { prompts: [], answers: [] };
  const seq = (contents.prompts.at(-1)?.seq ?? 0) + 1;
  return unique(input.models).map((model) => {
    const h = buildHistory(
      model,
      { seq, text: input.text },
      contents.prompts,
      contents.answers,
    );
    return {
      model,
      inputTokens: h.inputTokens,
      catchUpTokens: h.catchUpTokens,
    };
  });
}
