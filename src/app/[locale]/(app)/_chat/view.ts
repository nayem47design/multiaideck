// What a prompt shows: which answers (a retry or swap replaces the answer it retried), their
// badges, and the thinking rows. Pure data; ChatScreen turns it into components and copy.

import type { ThinkingStatus } from "@/components/organisms/ThinkingPanel";
import type { ModelId } from "@/lib/ai/models";
import { typicalAnswerMcr } from "@/lib/billing/pricing";
import { credits } from "@/lib/billing/units";
import type { Answer, Prompt } from "@/lib/contracts/chat";

/** Names map to `chat.badge.*` (desktop) and `chat.note.*` (mobile) messages. */
export type AnswerTag =
  "suggested" | "fastestCheapest" | "only" | "retried" | "caughtUp";

/** An answer still on its way. */
export const isOpen = (a: Answer) =>
  a.status === "queued" ||
  a.status === "catching-up" ||
  a.status === "streaming";
export const isFailed = (a: Answer) =>
  a.status === "failed" || a.status === "stopped";

/** No text yet this long after asking: "Taking longer than usual". */
export const SLOW_MS = 8_000;

/** Desktop card order follows the prompt; mobile tabs put Claude first (Figma M8). */
const TAB_FIRST: ModelId[] = ["claude", "gpt", "gemini"];

/** The answers on screen, in the prompt's order: a retry or swap takes its original's place. */
export function visibleAnswers(p: Prompt): Answer[] {
  const replaced = new Set(p.answers.map((a) => a.retryOf).filter(Boolean));
  const shown = p.answers.filter((a) => !replaced.has(a.id));
  const order = (a: Answer) => {
    // Walk back to the original answer to find the slot.
    let cur: Answer | undefined = a;
    while (cur?.retryOf) cur = p.answers.find((x) => x.id === cur!.retryOf);
    const i = p.models.indexOf((cur ?? a).model);
    return i < 0 ? p.models.indexOf(a.model) : i;
  };
  return shown
    .map((a, i) => ({ a, i, o: order(a) }))
    .sort((x, y) => (x.o < 0 ? 99 : x.o) - (y.o < 0 ? 99 : y.o) || x.i - y.i)
    .map((x) => x.a);
}

export const tabOrder = (answers: Answer[]) =>
  [...answers].sort((a, b) => {
    const ia = TAB_FIRST.indexOf(a.model);
    const ib = TAB_FIRST.indexOf(b.model);
    return (ia < 0 ? 9 : ia) - (ib < 0 ? 9 : ib);
  });

/** Badges: answered on retry, caught up, the only answer, suggested, fastest and cheapest. */
export function tagsOf(answers: Answer[]): Map<string, AnswerTag> {
  const tags = new Map<string, AnswerTag>();
  const done = answers.filter((a) => a.status === "done");
  for (const a of done) {
    if (a.retryOf && a.catchUpCredits === 0) tags.set(a.id, "retried");
    else if (a.catchUpCredits > 0) tags.set(a.id, "caughtUp");
  }
  if (done.length === 1 && answers.length > 1 && !tags.has(done[0].id))
    tags.set(done[0].id, "only");
  if (done.length > 1) {
    // Suggested: the most complete answer (most tokens).
    const suggested = done.reduce((m, a) => (a.tokens > m.tokens ? a : m));
    if (!tags.has(suggested.id)) tags.set(suggested.id, "suggested");
    const fastest = done.reduce((m, a) =>
      (a.durationMs ?? Infinity) < (m.durationMs ?? Infinity) ? a : m,
    );
    const cheapest = done.reduce((m, a) => (a.credits < m.credits ? a : m));
    if (fastest.id === cheapest.id && !tags.has(fastest.id))
      tags.set(fastest.id, "fastestCheapest");
  }
  return tags;
}

/** About what asking `model` again costs (short answer). */
export const retryCredits = (model: ModelId) =>
  Math.round(credits(typicalAnswerMcr(model, 96)) * 10) / 10;

export interface ThinkingRowData {
  answer: Answer;
  status: ThinkingStatus;
  seconds?: number;
}

/** Thinking rows: finished first (Figma), then writing, slow, catching up, not responding. */
export function thinkingRows(
  answers: Answer[],
  askedAt: string,
  now: number,
): ThinkingRowData[] {
  const slow = now - new Date(askedAt).getTime() > SLOW_MS;
  const rows = answers.map((a): ThinkingRowData => {
    if (a.status === "done")
      return { answer: a, status: "done", seconds: (a.durationMs ?? 0) / 1000 };
    if (isFailed(a)) return { answer: a, status: "unresponsive" };
    if (a.status === "catching-up") return { answer: a, status: "catching-up" };
    if (!a.text && slow) return { answer: a, status: "slow" };
    return { answer: a, status: "writing" };
  });
  const rank: Record<ThinkingStatus, number> = {
    done: 0,
    writing: 1,
    "catching-up": 2,
    slow: 3,
    unresponsive: 4,
  };
  return rows.sort((x, y) => rank[x.status] - rank[y.status]);
}

/** Sum of what a prompt charged (failed and stopped answers cost nothing). */
export function promptCredits(p: Prompt, answers = visibleAnswers(p)) {
  const sum =
    answers.reduce((s, a) => s + (a.status === "done" ? a.credits : 0), 0) +
    (p.best?.status === "done" ? p.best.credits : 0);
  return Math.round(sum * 10) / 10;
}
