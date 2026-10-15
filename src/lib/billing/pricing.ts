import type { ModelId } from "@/lib/ai/models";

import { mcr } from "./units";

// Prices, estimates and reserves for answers, the Best answer merge step and pictures.
//
// ⚠ BUSINESS-OWNED CONFIG. Every number below is a PLACEHOLDER chosen so that the prototype's
// short answers cost about what Figma shows (GPT-5 ≈ 0.9 cr, Claude ≈ 1.4 cr, Gemini ≈ 0.3 cr for
// ~100 output tokens). The business sets the real rates from provider prices and margin; nothing
// else in the code needs to change. Amounts are integers in millicredits (1 cr = 1000 mcr).
//
// Safe for the browser (no secrets): the composer shows estimates computed here too.

export interface Rate {
  /** Credits per 1,000 input tokens. */
  input: number;
  /** Credits per 1,000 output tokens. */
  output: number;
}

/** PLACEHOLDER rates, credits per 1K tokens. */
export const RATES: Record<ModelId, Rate> = {
  gpt: { input: 2, output: 9 },
  claude: { input: 3, output: 9.5 },
  gemini: { input: 0.5, output: 5 },
  o3: { input: 4, output: 20 },
  deepseek: { input: 0.6, output: 3 },
  grok: { input: 3, output: 9 },
  perplexity: { input: 2, output: 8 },
  llama: { input: 0.3, output: 1.5 },
  qwen: { input: 0.5, output: 2.5 },
};

/** PLACEHOLDER: the Best answer merge step (reads every answer, writes the summary). */
export const MERGE_RATE: Rate = { input: 4, output: 12 };

/** PLACEHOLDER: one picture, about 40 credits (৳0.40). */
export const IMAGE_MCR = mcr(40);

/** Output tokens a short answer usually has (estimate low end). */
export const EST_MIN_OUTPUT = 250;
/** Output tokens a long answer usually has (estimate high end). */
export const EST_MAX_OUTPUT = 600;
/**
 * Hard cap on output tokens per answer. The reserve covers it, so an answer never costs more
 * than what was held (charges are capped at the reserve).
 */
export const MAX_OUTPUT_TOKENS = 1200;
/** Merge step output cap and typical size. */
export const MERGE_MAX_OUTPUT = 600;
export const MERGE_EST_OUTPUT = 200;

/** Rough token count of text (≈ 4 characters a token; Bangla is denser, so round up). */
export function tokensOf(text: string) {
  if (!text) return 0;
  const bangla = /[ঀ-৿]/.test(text);
  return Math.ceil(text.length / (bangla ? 2 : 4));
}

/** Cost in mcr of a call with these token counts. */
export function costMcr(rate: Rate, inputTokens: number, outputTokens: number) {
  return Math.round(
    inputTokens * rate.input + outputTokens * rate.output, // credits/1K tokens × tokens = mcr
  );
}

export const answerCostMcr = (
  model: ModelId,
  inputTokens: number,
  outputTokens: number,
) => costMcr(RATES[model], inputTokens, outputTokens);

/** The catch-up part of an answer: reading earlier prompts the model missed. */
export const catchUpCostMcr = (model: ModelId, catchUpTokens: number) =>
  costMcr(RATES[model], catchUpTokens, 0);

/** What to hold before calling a model: input + the output cap. */
export const answerReserveMcr = (model: ModelId, inputTokens: number) =>
  costMcr(RATES[model], inputTokens, MAX_OUTPUT_TOKENS);

/** Merge step: it reads the prompt and every answer (each up to the cap). */
export const mergeReserveMcr = (promptTokens: number, answers: number) =>
  costMcr(
    MERGE_RATE,
    promptTokens + answers * MAX_OUTPUT_TOKENS,
    MERGE_MAX_OUTPUT,
  );
export const mergeCostMcr = (inputTokens: number, outputTokens: number) =>
  costMcr(MERGE_RATE, inputTokens, outputTokens);

export interface EstimateInput {
  model: ModelId;
  /** Tokens of the prompt plus the model's own history. */
  inputTokens: number;
  /** Tokens of earlier prompts this model missed (0 when it answered them all). */
  catchUpTokens: number;
}

/** "≈ min to max" for a prompt, in mcr, plus the catch-up part per model. */
export function estimatePrompt(
  models: EstimateInput[],
  { best }: { best: boolean },
) {
  let min = 0;
  let max = 0;
  for (const m of models) {
    min += costMcr(RATES[m.model], m.inputTokens, EST_MIN_OUTPUT);
    max += costMcr(RATES[m.model], m.inputTokens, EST_MAX_OUTPUT);
  }
  if (best && models.length > 1) {
    const promptTokens = Math.min(...models.map((m) => m.inputTokens));
    min += costMcr(
      MERGE_RATE,
      promptTokens + models.length * EST_MIN_OUTPUT,
      MERGE_EST_OUTPUT,
    );
    max += costMcr(
      MERGE_RATE,
      promptTokens + models.length * EST_MAX_OUTPUT,
      MERGE_EST_OUTPUT,
    );
  }
  return {
    minMcr: min,
    maxMcr: max,
    catchUp: models
      .filter((m) => m.catchUpTokens > 0)
      .map((m) => ({
        model: m.model,
        mcr: catchUpCostMcr(m.model, m.catchUpTokens),
      })),
  };
}

/** Typical cost of one answer (model picker columns): a short prompt and a long answer. */
export const typicalAnswerMcr = (
  model: ModelId,
  outputTokens = EST_MAX_OUTPUT,
) => costMcr(RATES[model], 30, outputTokens);
