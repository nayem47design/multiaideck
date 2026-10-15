// What each step of a chat shows: which prompt, the previous prompt (folded), the thinking rows.
// Pure data; the screens turn it into components and copy.

import type { ThinkingStatus } from "@/components/organisms/ThinkingPanel";
import {
  COFFEE_CHAT,
  type AnswerModel,
  type DemoBestAnswer,
  type DemoPrompt,
} from "@/lib/mock/chat";

import type { ChatParams, Step } from "./state";

export interface StepData {
  prompt: DemoPrompt;
  /** The earlier prompt, shown folded above later prompts. */
  previous?: { n: number; prompt: DemoPrompt };
  /** Number of the current prompt. */
  n: number;
  best?: DemoBestAnswer;
}

const only = (p: DemoPrompt, model?: AnswerModel): DemoPrompt =>
  model ? { ...p, answers: p.answers.filter((a) => a.model === model) } : p;

export function coffeeStep({ step, retried, only: to }: ChatParams): StepData {
  const { p1, p2, p2Retried, p3 } = COFFEE_CHAT.prompts;
  const p2Now = step === "prompt-2-retry" || retried ? p2Retried : p2;
  switch (step) {
    case "thinking-best":
    case "best":
    case "thinking-compare":
    case "compare":
      return { prompt: p1, n: 1, best: COFFEE_CHAT.best };
    case "thinking-2":
    case "prompt-2":
    case "prompt-2-retry":
    case "prompt-3-who":
      return { prompt: p2Now, n: 2, previous: { n: 1, prompt: p1 } };
    case "thinking-3":
    case "prompt-3":
      return { prompt: only(p3, to), n: 3, previous: { n: 2, prompt: p2Now } };
  }
}

export interface ThinkingRowData {
  model: AnswerModel;
  status: ThinkingStatus;
  seconds?: number;
}

/**
 * Thinking rows per step, in Figma's order. `phase` advances once while the AIs write
 * (phase 1: one more AI finished) before the answers screen replaces it.
 */
export function thinkingRows(
  step: Step,
  phase: number,
  to?: AnswerModel,
): ThinkingRowData[] {
  if (step === "thinking-2")
    return [
      phase
        ? { model: "claude", status: "done", seconds: 2.3 }
        : { model: "claude", status: "writing" },
      { model: "gpt", status: "slow" },
      { model: "gemini", status: "unresponsive" },
    ];
  if (step === "thinking-3") {
    const rows: ThinkingRowData[] = [
      phase
        ? { model: "claude", status: "done", seconds: 2.3 }
        : { model: "claude", status: "writing" },
      { model: "gpt", status: "catching-up" },
      { model: "gemini", status: "catching-up" },
    ];
    return to ? rows.filter((r) => r.model === to) : rows;
  }
  return [
    { model: "gemini", status: "done", seconds: 0.9 },
    phase
      ? { model: "gpt", status: "done", seconds: 1.8 }
      : { model: "gpt", status: "writing" },
    { model: "claude", status: "writing" },
  ];
}

/** The step a thinking step turns into when the answers are in. */
export const AFTER_THINKING: Partial<Record<Step, Step>> = {
  "thinking-best": "best",
  "thinking-compare": "compare",
  "thinking-2": "prompt-2",
  "thinking-3": "prompt-3",
};

/** Desktop card order (Figma: GPT-5, Claude, Gemini) and mobile tab order (Claude first). */
export const CARD_ORDER: AnswerModel[] = ["gpt", "claude", "gemini"];
export const TAB_ORDER: AnswerModel[] = ["claude", "gpt", "gemini"];

export function defaultTab(step: Step): AnswerModel {
  return step === "prompt-2" ||
    step === "prompt-2-retry" ||
    step === "prompt-3-who"
    ? "gpt"
    : "claude";
}
