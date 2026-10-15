import "server-only";

import { credits } from "@/lib/billing/units";
import type { Answer, BestAnswer, Prompt } from "@/lib/contracts/chat";
import type { answers, bestAnswers, prompts } from "@/lib/db/schema";

import type { LivePrompt } from "./bus";

// Database rows → API shapes (src/lib/contracts/chat.ts), with the live overlay for running
// prompts (text the database hasn't caught up with yet).

export type AnswerRow = typeof answers.$inferSelect;
export type PromptRow = typeof prompts.$inferSelect;
export type BestRow = typeof bestAnswers.$inferSelect;

/** `credits` is everything charged for the answer, catch-up included; `catchUpCredits` that part. */
export function toAnswer(a: AnswerRow, live?: LivePrompt): Answer {
  const l = live?.answers.get(a.id);
  const terminal = ["done", "failed", "stopped"].includes(a.status);
  return {
    id: a.id,
    promptId: a.promptId,
    model: a.model,
    modelVersion: a.modelVersion,
    status: !terminal && l ? l.status : a.status,
    failure: !terminal && l ? l.failure : a.failure,
    text: !terminal && l && l.text.length > a.text.length ? l.text : a.text,
    durationMs: a.durationMs,
    tokens: a.outputTokens,
    credits: credits(a.costMcr + a.catchUpCostMcr),
    catchUpCredits: credits(a.catchUpCostMcr),
    retryOf: a.retryOf,
  };
}

export function toBest(b: BestRow, live?: LivePrompt): BestAnswer {
  if (b.status === "streaming" && live?.best) return live.best;
  return {
    status: b.status,
    intro: b.intro,
    points: b.points,
    credits: credits(b.costMcr),
    durationMs: b.durationMs,
  };
}

export function toPrompt(
  p: PromptRow,
  answerRows: AnswerRow[],
  best: BestRow | undefined,
  live?: LivePrompt,
): Prompt {
  return {
    id: p.id,
    seq: p.seq,
    text: p.text,
    mode: p.mode,
    models: p.models,
    attachments: p.attachments,
    status: p.status,
    createdAt: p.createdAt.toISOString(),
    answers: answerRows
      .slice()
      // Same-transaction rows share created_at: then the prompt's model order.
      .sort(
        (a, b) =>
          a.createdAt.getTime() - b.createdAt.getTime() ||
          p.models.indexOf(a.model) - p.models.indexOf(b.model),
      )
      .map((a) => toAnswer(a, live)),
    best: best ? toBest(best, live) : null,
  };
}
