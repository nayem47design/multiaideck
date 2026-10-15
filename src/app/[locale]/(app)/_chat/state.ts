// The scripted demo of the coffee-shop chat follows the Figma prototype, one step per screen:
//
//   thinking-best → best                       (Thinking · Best answer → Best answer)
//   thinking-compare → compare                 (Thinking · Compare → Compare)
//   thinking-2 → prompt-2 → prompt-2-retry     (Prompt 2: 2 AIs slow → 1 of 3 → GPT-5 on retry)
//   prompt-3-who → thinking-3 → prompt-3       (Writing prompt 3 → catching up → all 3 answered)
//
// Deep links (for tests and reviews), all optional:
//   /c/coffee-shop-names?state=<step>   a step above; default "prompt-3" (the sidebar's target)
//   &retried=1                          prompt 2 with GPT-5 answered on retry (prompt-3-who, …)
//   &only=claude                        prompt 3 sent only to Claude
//   &tab=gpt|claude|gemini              mobile Compare: which answer is shown
//   &composer=menu|voice|voice-ready|files   the composer's “+” menu, voice, or files state
//   &sheet=mode|models                  mobile sheets (M7, M25) or the desktop model picker
//   &hold=1                             keep a thinking step on screen (no timer)
// Moving between steps updates ?state= with history.pushState, so Back works.

import type { AnswerModel } from "@/lib/mock/chat";

export const STEPS = [
  "thinking-best",
  "best",
  "thinking-compare",
  "compare",
  "thinking-2",
  "prompt-2",
  "prompt-2-retry",
  "prompt-3-who",
  "thinking-3",
  "prompt-3",
] as const;

export type Step = (typeof STEPS)[number];

/** Steps the one-prompt demo chats support. */
export const SIMPLE_STEPS: Step[] = [
  "thinking-best",
  "best",
  "thinking-compare",
  "compare",
];

export type ComposerPreset = "menu" | "voice" | "voice-ready" | "files";
export type SheetPreset = "mode" | "models";

export interface ChatParams {
  step: Step;
  retried: boolean;
  only?: AnswerModel;
  tab?: AnswerModel;
  composer?: ComposerPreset;
  sheet?: SheetPreset;
  hold: boolean;
}

const MODELS: AnswerModel[] = ["gpt", "claude", "gemini"];
const pick = <T extends string>(v: string | null, list: readonly T[]) =>
  v && (list as readonly string[]).includes(v) ? (v as T) : undefined;

export function parseParams(
  sp: URLSearchParams,
  fallback: Step,
  allowed: readonly Step[] = STEPS,
): ChatParams {
  return {
    step: pick(sp.get("state"), allowed) ?? fallback,
    retried: sp.get("retried") === "1",
    only: pick(sp.get("only"), MODELS),
    tab: pick(sp.get("tab"), MODELS),
    composer: pick(sp.get("composer"), [
      "menu",
      "voice",
      "voice-ready",
      "files",
    ] as const),
    sheet: pick(sp.get("sheet"), ["mode", "models"] as const),
    hold: sp.get("hold") === "1",
  };
}

export function stepQuery(
  step: Step,
  extra: { retried?: boolean; only?: AnswerModel; tab?: AnswerModel } = {},
) {
  const q = new URLSearchParams({ state: step });
  if (extra.retried) q.set("retried", "1");
  if (extra.only) q.set("only", extra.only);
  if (extra.tab) q.set("tab", extra.tab);
  return `?${q}`;
}

export const isThinking = (s: Step) => s.startsWith("thinking");

/** Answer mode a step is in (Best answer or Compare). */
export const modeOf = (s: Step) =>
  s === "best" || s === "thinking-best" ? "best" : "compare";
