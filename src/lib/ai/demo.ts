import type { LanguageModel } from "ai";
import { MockLanguageModelV4 } from "ai/test";

import { tokensOf } from "@/lib/billing/pricing";
import { COFFEE_CHAT, simpleChat, type DemoPrompt } from "@/lib/mock/chat";

import { MODEL_SPECS } from "./catalog";
import type { ModelId } from "./models";

// The scripted demo model: stands in for a provider whose key isn't set (development, tests, e2e).
// It streams plausible text word by word with realistic timing per model, reports token usage,
// and can be cued to misbehave so the prototype's failure states are reproducible:
//
//   #slow[:gpt,claude]          answers, but much later (the "Taking longer…" state)
//   #timeout[:gpt]              never answers; the orchestrator's timeout fails it ("timeout")
//   #unavailable[:gemini]       the provider refuses at once ("unavailable")
//   #error[:claude]             fails half way through ("error")
//
// Cues go anywhere in the prompt text; without a model list they apply to every model. They (and
// the prototype's scripted failures) apply only to a first attempt: a retry answers normally, so
// "fail → retry → answered" works. The prototype's own prompts (the coffee-shop chat, "Hellow"…)
// get the prototype's answers and token counts.

export const DEMO_VERSION = "demo";

export type DemoCue = "slow" | "timeout" | "unavailable" | "error";

/** Per-call options the orchestrator passes through providerOptions.demo. */
export interface DemoCallOptions {
  /** A retry or swap: cues and scripted failures don't apply. */
  retry?: boolean;
  /** Earlier prompts this model reads first ("catching up"): adds a short pause. */
  catchUpPrompts?: number;
}

/** Thrown for the "unavailable" cue; looks like a provider's HTTP 503. */
export class DemoProviderError extends Error {
  readonly statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "DemoProviderError";
    this.statusCode = statusCode;
  }
}

const CUE = /#(slow|timeout|unavailable|error)(?::([a-z0-9,]+))?/gi;

export function cuesFor(text: string, model: ModelId): Set<DemoCue> {
  const cues = new Set<DemoCue>();
  for (const m of text.matchAll(CUE)) {
    const list = m[2]?.toLowerCase().split(",");
    if (!list || list.includes(model)) cues.add(m[1].toLowerCase() as DemoCue);
  }
  return cues;
}

/** Prompt text without cues (what the demo "reads"). */
export const stripCues = (text: string) =>
  text
    .replace(CUE, "")
    .replace(/\s{2,}/g, " ")
    .trim();

// ---- Timing (ms): first token, then per word. Gemini is fastest, Claude most careful.

const TIMING: Record<ModelId, { first: number; perWord: number }> = {
  gpt: { first: 500, perWord: 35 },
  claude: { first: 800, perWord: 40 },
  gemini: { first: 250, perWord: 18 },
  o3: { first: 1500, perWord: 45 },
  deepseek: { first: 700, perWord: 35 },
  grok: { first: 600, perWord: 30 },
  perplexity: { first: 900, perWord: 35 },
  llama: { first: 300, perWord: 20 },
  qwen: { first: 500, perWord: 30 },
};
const SLOW_FACTOR = 2;
const SLOW_EXTRA_MS = 3000;
const CATCH_UP_MS_PER_PROMPT = 400;

/** Tests can make the demo model instant. */
let speed = 1;
export function setDemoSpeed(factor: number) {
  speed = factor;
}

// ---- The prototype's script

interface Scripted {
  text?: string;
  tokens?: number;
  failure?: "timeout" | "unavailable";
}

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();

function scriptFrom(prompt: DemoPrompt, failures = true) {
  const out = new Map<ModelId, Scripted>();
  for (const a of prompt.answers)
    out.set(a.model, {
      text: a.text,
      tokens: a.tokens,
      failure: failures ? a.failure : undefined,
    });
  return out;
}

const SCRIPT = new Map<string, Map<ModelId, Scripted>>([
  [norm(COFFEE_CHAT.prompts.p1.text), scriptFrom(COFFEE_CHAT.prompts.p1)],
  [norm(COFFEE_CHAT.prompts.p2.text), scriptFrom(COFFEE_CHAT.prompts.p2)],
  [norm(COFFEE_CHAT.prompts.p3.text), scriptFrom(COFFEE_CHAT.prompts.p3)],
  ...(["hellow", "who-are-you", "how-old-are-you"] as const).map(
    (id) =>
      [
        norm(simpleChat(id)!.prompt.text),
        scriptFrom(simpleChat(id)!.prompt),
      ] as [string, Map<ModelId, Scripted>],
  ),
]);
/** Answers on retry for scripted failures (prompt 2: GPT-5 answers on retry). */
const SCRIPT_RETRY = new Map<string, Map<ModelId, Scripted>>([
  [
    norm(COFFEE_CHAT.prompts.p2.text),
    scriptFrom(COFFEE_CHAT.prompts.p2Retried, false),
  ],
]);

// ---- Plausible text for anything else: each model has its own voice.

function topicOf(prompt: string) {
  const clean = stripCues(prompt).replace(/[?!.]+$/, "");
  return clean.length > 80 ? `${clean.slice(0, 77)}…` : clean || "this";
}

const VOICES: Record<ModelId, (topic: string) => string> = {
  gpt: (t) =>
    `Here’s a clear way to approach “${t}”:\n\n1. Start with the goal: decide what a good result looks like for you.\n2. Pick the simplest option that gets you there, and try it this week.\n3. Check what worked, then adjust one thing at a time.\n\nWant me to turn this into a short checklist?`,
  claude: (t) =>
    `A few thoughts on “${t}”, with the reasoning behind each:\n\n1. Be specific about who it’s for: the right answer depends on them.\n2. Keep it simple at first, so it’s easy to change later.\n3. Write down why you chose it; future you will thank you.\n\nIf you share a little more context, I can tailor this further.`,
  gemini: (t) =>
    `Quick take on “${t}”:\n\n1. Keep it short.\n2. Make it local and personal.\n3. Test it with a few people first.`,
  o3: (t) =>
    `Let’s reason about “${t}” step by step.\n\n1. Constraints: time, money and who decides.\n2. Options: list three, then remove the ones that break a constraint.\n3. Choice: the remaining option with the lowest risk.\n\nConclusion: start small and measure.`,
  deepseek: (t) =>
    `On “${t}”:\n\n1. Define the problem in one sentence.\n2. Compare two or three options on cost and effort.\n3. Choose, then review after a week.`,
  grok: (t) =>
    `Straight answer on “${t}”: keep it simple, make it yours, and don’t overthink it.\n\n1. Do the obvious thing first.\n2. Ask people what they think.\n3. Change what doesn’t land.`,
  perplexity: (t) =>
    `Summary for “${t}”:\n\n1. Most guides recommend starting with a clear goal.\n2. Simple, local choices tend to work best.\n3. Review results after a short trial.`,
  llama: (t) =>
    `Ideas for “${t}”:\n\n1. Keep it simple.\n2. Make it local.\n3. Try it and adjust.`,
  qwen: (t) =>
    `About “${t}”:\n\n1. Decide the goal.\n2. Pick a simple first step.\n3. Review and improve.`,
};

// ---- Helpers

function lastUserText(
  prompt: { role: string; content: unknown }[],
): string | undefined {
  for (let i = prompt.length - 1; i >= 0; i--) {
    const m = prompt[i];
    if (m.role !== "user") continue;
    const parts = m.content as { type: string; text?: string }[];
    return parts
      .filter((p) => p.type === "text")
      .map((p) => p.text ?? "")
      .join("\n");
  }
}

function promptText(prompt: { role: string; content: unknown }[]) {
  return prompt
    .map((m) =>
      typeof m.content === "string"
        ? m.content
        : (m.content as { type: string; text?: string }[])
            .map((p) => p.text ?? "")
            .join(" "),
    )
    .join("\n");
}

function sleep(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) return reject(signal.reason);
    const t = setTimeout(resolve, Math.max(0, ms * speed));
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(t);
        reject(signal.reason);
      },
      { once: true },
    );
  });
}

/** Splits text into word-sized deltas that keep their spaces and line breaks. */
const words = (text: string) => text.match(/\S+\s*|\s+/g) ?? [];

const usage = (input: number, output: number) => ({
  inputTokens: {
    total: input,
    noCache: input,
    cacheRead: undefined,
    cacheWrite: undefined,
  },
  outputTokens: { total: output, text: output, reasoning: undefined },
});

/** What the demo model says (or how it fails) for one call. Exported for the seed and tests. */
export function demoAnswer(
  model: ModelId,
  promptTextNow: string,
  { retry = false }: { retry?: boolean } = {},
): Scripted & { cues: Set<DemoCue> } {
  const key = norm(stripCues(promptTextNow));
  const scripted =
    (retry ? SCRIPT_RETRY.get(key)?.get(model) : undefined) ??
    SCRIPT.get(key)?.get(model);
  return {
    text: scripted?.text ?? VOICES[model](topicOf(promptTextNow)),
    tokens: scripted?.text ? scripted.tokens : undefined,
    failure: retry ? undefined : scripted?.failure,
    cues: retry ? new Set<DemoCue>() : cuesFor(promptTextNow, model),
  };
}

/** A demo language model for one ModelId. */
export function createDemoModel(model: ModelId): LanguageModel {
  return new MockLanguageModelV4({
    provider: "multiaideck-demo",
    modelId: `${DEMO_VERSION}:${MODEL_SPECS[model].providerModelId ?? model}`,
    doStream: async (options) => {
      const signal = options.abortSignal;
      const demo = (options.providerOptions?.demo ?? {}) as DemoCallOptions;
      const prompt = options.prompt as { role: string; content: unknown }[];
      const now = lastUserText(prompt) ?? "";
      const answer = demoAnswer(model, now, { retry: demo.retry });
      const { cues } = answer;
      const timing = TIMING[model];
      const slow = cues.has("slow");
      const inputTokens = tokensOf(promptText(prompt));

      if (cues.has("unavailable") || answer.failure === "unavailable") {
        await sleep(300, signal);
        throw new DemoProviderError(
          `${MODEL_SPECS[model].provider} is unavailable (demo)`,
          503,
        );
      }

      const text = answer.text!;
      const parts = words(text);
      const outputTokens = answer.tokens ?? tokensOf(text);
      const hang = cues.has("timeout") || answer.failure === "timeout";
      const failHalfway = cues.has("error");
      let i = 0;
      let started = false;

      const stream = new ReadableStream({
        async pull(controller) {
          try {
            if (!started) {
              started = true;
              controller.enqueue({ type: "stream-start", warnings: [] });
              await sleep(
                (demo.catchUpPrompts ?? 0) * CATCH_UP_MS_PER_PROMPT +
                  timing.first * (slow ? SLOW_FACTOR : 1) +
                  (slow ? SLOW_EXTRA_MS : 0),
                signal,
              );
              if (hang) {
                // Never answers: wait until the orchestrator gives up (its timeout aborts us).
                await new Promise((_, reject) => {
                  if (signal?.aborted) reject(signal.reason);
                  signal?.addEventListener("abort", () =>
                    reject(signal.reason),
                  );
                });
              }
              controller.enqueue({ type: "text-start", id: "t" });
              return;
            }
            if (failHalfway && i >= parts.length / 2) {
              controller.enqueue({
                type: "error",
                error: new DemoProviderError("Demo error half way", 500),
              });
              controller.close();
              return;
            }
            if (i < parts.length) {
              await sleep(timing.perWord * (slow ? 1.5 : 1), signal);
              controller.enqueue({
                type: "text-delta",
                id: "t",
                delta: parts[i++],
              });
              return;
            }
            controller.enqueue({ type: "text-end", id: "t" });
            controller.enqueue({
              type: "finish",
              finishReason: { unified: "stop", raw: undefined },
              usage: usage(inputTokens, outputTokens),
            });
            controller.close();
          } catch (e) {
            controller.error(e);
          }
        },
      });
      return { stream };
    },
  });
}
