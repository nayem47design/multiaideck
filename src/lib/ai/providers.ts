import "server-only";

import { createAnthropic } from "@ai-sdk/anthropic";
import { createDeepSeek } from "@ai-sdk/deepseek";
import { createGoogle } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { createXai } from "@ai-sdk/xai";
import type { ImageModel, LanguageModel } from "ai";

import { demoMode, env } from "@/lib/server/env";

import {
  IMAGE_PROVIDER_MODEL,
  MERGE_MODEL,
  MODEL_SPECS,
  type ProviderKey,
} from "./catalog";
import { createDemoModel, DEMO_VERSION } from "./demo";
import type { ModelId } from "./models";

// Provider registry: each ModelId maps to the real provider model when its key is set, else to
// the scripted demo model (development and tests). In production a model without a key — or
// without a provider adapter (Perplexity, Llama, Qwen for now) — is "unavailable": its answer
// fails at once and costs nothing, rather than charging for a demo answer.
//
// Keys are read from env on the server only and never logged.

export type ResolvedModel =
  | { kind: "real" | "demo"; model: LanguageModel; version: string }
  | { kind: "unavailable"; version: string };

const KEYS: Record<ProviderKey, () => string | undefined> = {
  openai: () => env.OPENAI_API_KEY,
  anthropic: () => env.ANTHROPIC_API_KEY,
  google: () => env.GOOGLE_GENERATIVE_AI_API_KEY,
  deepseek: () => env.DEEPSEEK_API_KEY,
  xai: () => env.XAI_API_KEY,
};

function languageModel(key: ProviderKey, modelId: string): LanguageModel {
  const apiKey = KEYS[key]();
  switch (key) {
    case "openai":
      return createOpenAI({ apiKey })(modelId);
    case "anthropic":
      return createAnthropic({ apiKey })(modelId);
    case "google":
      return createGoogle({ apiKey })(modelId);
    case "deepseek":
      return createDeepSeek({ apiKey })(modelId);
    case "xai":
      return createXai({ apiKey })(modelId);
  }
}

export const hasProviderKey = (key: ProviderKey) => !!KEYS[key]();

/** The model that answers for `id`. */
export function resolveModel(id: ModelId): ResolvedModel {
  const spec = MODEL_SPECS[id];
  if (
    spec.providerKey &&
    spec.providerModelId &&
    hasProviderKey(spec.providerKey)
  )
    return {
      kind: "real",
      model: languageModel(spec.providerKey, spec.providerModelId),
      version: spec.providerModelId,
    };
  // A demo deployment answers from the scripted demo model, like development.
  if (env.NODE_ENV === "production" && !demoMode())
    return { kind: "unavailable", version: spec.providerModelId ?? id };
  return { kind: "demo", model: createDemoModel(id), version: DEMO_VERSION };
}

/** The Best answer merge step's model, or null to use the demo merge. */
export function resolveMergeModel(): {
  model: LanguageModel;
  version: string;
} | null {
  for (const m of MERGE_MODEL)
    if (hasProviderKey(m.providerKey))
      return {
        model: languageModel(m.providerKey, m.modelId),
        version: m.modelId,
      };
  return null;
}

/** The picture model, or null for the generated placeholder. */
export function resolveImageModel(): {
  model: ImageModel;
  version: string;
} | null {
  if (!hasProviderKey("openai")) return null;
  return {
    model: createOpenAI({ apiKey: KEYS.openai() }).image(IMAGE_PROVIDER_MODEL),
    version: IMAGE_PROVIDER_MODEL,
  };
}
