import type { ModelMessage } from "ai";

import { tokensOf } from "@/lib/billing/pricing";

import type { ModelId } from "./models";

// What one model is sent (AGENTS.md rule 7: each answer is independent).
//
// A model receives the user's prompts in this chat and ITS OWN earlier answers — never another
// model's answer, never the Best answer summary, including after retries, swaps and failures.
// For each earlier prompt the model's latest finished answer is used; when it has none (it failed,
// was stopped, or wasn't asked), the prompt is still sent so the model "catches up", and those
// prompts' tokens are the catch-up cost shown on its own line.

export const INSTRUCTIONS =
  "You are one of several AI assistants answering the same user independently. " +
  "Answer the user's latest message. Earlier user messages you did not reply to are context " +
  "you missed: read them first. Reply in the language the user writes in.";

export interface HistoryPrompt {
  id: string;
  seq: number;
  text: string;
}

export interface HistoryAnswer {
  promptId: string;
  model: ModelId;
  status: string;
  text: string;
  createdAt: Date;
}

export interface History {
  messages: ModelMessage[];
  /** Tokens of earlier prompts this model has no answer for. */
  catchUpTokens: number;
  /** How many earlier prompts it missed. */
  missed: number;
  /** Every token sent (prompts + own answers), for estimates. */
  inputTokens: number;
}

/**
 * Messages for `model` answering `current`. `prompts` and `answers` are the chat's (any order);
 * only prompts before `current` and only `model`'s own finished answers are used.
 */
export function buildHistory(
  model: ModelId,
  current: { seq: number; text: string },
  prompts: HistoryPrompt[],
  answers: HistoryAnswer[],
): History {
  const messages: ModelMessage[] = [];
  let catchUpTokens = 0;
  let missed = 0;
  let inputTokens = tokensOf(INSTRUCTIONS);
  const earlier = prompts
    .filter((p) => p.seq < current.seq)
    .sort((a, b) => a.seq - b.seq);
  for (const p of earlier) {
    messages.push({ role: "user", content: p.text });
    inputTokens += tokensOf(p.text);
    const own = answers
      .filter(
        (a) =>
          a.promptId === p.id &&
          a.model === model && // only this model's own answer
          a.status === "done",
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
    if (own) {
      messages.push({ role: "assistant", content: own.text });
      inputTokens += tokensOf(own.text);
    } else {
      missed++;
      catchUpTokens += tokensOf(p.text);
    }
  }
  messages.push({ role: "user", content: current.text });
  inputTokens += tokensOf(current.text);
  return { messages, catchUpTokens, missed, inputTokens };
}
