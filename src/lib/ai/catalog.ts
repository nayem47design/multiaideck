import type { ModelId } from "./models";

// The one place for model versions: the name and version the UI shows (GPT-5, Claude Sonnet 4,
// Gemini 3 Flash…) and the provider model id the server calls. Safe to import in the browser:
// it holds no keys. Which provider key turns a model "real" is decided in ./providers.ts.
//
// Names are brand names: they are not translated.

export type ProviderKey =
  "openai" | "anthropic" | "google" | "deepseek" | "xai";

export type ModelTag =
  | "balanced"
  | "allRound"
  | "writing"
  | "longDocs"
  | "fast"
  | "imagesIn"
  | "reasoning"
  | "maths"
  | "lowCost"
  | "webSearch"
  | "sources"
  | "realTime"
  | "openSource"
  | "multilingual";

export interface ModelSpec {
  id: ModelId;
  /** Full display name, e.g. "Claude Sonnet 4". */
  name: string;
  /** Short name in tight places, e.g. "Claude". */
  short: string;
  /** Company, e.g. "Anthropic" (shown in failure messages). */
  provider: string;
  /** Version label in the model picker, e.g. "Sonnet 4". */
  version: string;
  /** Which SDK provider serves it, or null when there is no provider adapter yet. */
  providerKey: ProviderKey | null;
  /** Model id passed to the provider, e.g. "gpt-5". */
  providerModelId: string | null;
  /** Message keys under picker.tags. */
  tags: ModelTag[];
  speed: 1 | 2 | 3;
}

export const MODEL_SPECS: Record<ModelId, ModelSpec> = {
  gpt: {
    id: "gpt",
    name: "GPT-5",
    short: "GPT-5",
    provider: "OpenAI",
    version: "GPT-5",
    providerKey: "openai",
    providerModelId: "gpt-5",
    tags: ["balanced", "allRound"],
    speed: 2,
  },
  claude: {
    id: "claude",
    name: "Claude Sonnet 4",
    short: "Claude",
    provider: "Anthropic",
    version: "Sonnet 4",
    providerKey: "anthropic",
    providerModelId: "claude-sonnet-4-0",
    tags: ["writing", "longDocs"],
    speed: 2,
  },
  gemini: {
    id: "gemini",
    name: "Gemini 3 Flash",
    short: "Gemini",
    provider: "Google",
    version: "3 Flash Preview",
    providerKey: "google",
    providerModelId: "gemini-3-flash-preview",
    tags: ["fast", "imagesIn"],
    speed: 3,
  },
  o3: {
    id: "o3",
    name: "o3",
    short: "o3",
    provider: "OpenAI",
    version: "o3",
    providerKey: "openai",
    providerModelId: "o3",
    tags: ["reasoning", "maths"],
    speed: 1,
  },
  deepseek: {
    id: "deepseek",
    name: "DeepSeek",
    short: "DeepSeek",
    provider: "DeepSeek",
    version: "V3.2",
    providerKey: "deepseek",
    providerModelId: "deepseek-chat",
    tags: ["reasoning", "lowCost"],
    speed: 2,
  },
  grok: {
    id: "grok",
    name: "Grok",
    short: "Grok",
    provider: "xAI",
    version: "Grok 4",
    providerKey: "xai",
    providerModelId: "grok-4",
    tags: ["realTime"],
    speed: 2,
  },
  perplexity: {
    id: "perplexity",
    name: "Perplexity",
    short: "Perplexity",
    provider: "Perplexity",
    version: "Sonar Pro",
    providerKey: null,
    providerModelId: null,
    tags: ["webSearch", "sources"],
    speed: 2,
  },
  llama: {
    id: "llama",
    name: "Llama",
    short: "Llama",
    provider: "Meta",
    version: "4 Scout",
    providerKey: null,
    providerModelId: null,
    tags: ["fast", "openSource"],
    speed: 3,
  },
  qwen: {
    id: "qwen",
    name: "Qwen",
    short: "Qwen",
    provider: "Alibaba",
    version: "3.5 Plus",
    providerKey: null,
    providerModelId: null,
    tags: ["multilingual"],
    speed: 2,
  },
};

/** Picker order (Figma's Model picker). */
export const PICKER_ORDER: ModelId[] = [
  "gpt",
  "claude",
  "gemini",
  "o3",
  "deepseek",
  "perplexity",
  "grok",
  "llama",
  "qwen",
];

/** The five models the mobile Choose AIs sheet lists (M25). */
export const MOBILE_PICKER_ORDER: ModelId[] = [
  "gpt",
  "claude",
  "gemini",
  "deepseek",
  "grok",
];

/** Asked when the user has no preset yet. */
export const DEFAULT_MODELS: ModelId[] = ["gpt", "claude", "gemini"];

/** A prompt asks up to six AIs. */
export const MAX_MODELS = 6;

/** Image studio's model (Figma draws the Gemini orb on picture chats). */
export const IMAGE_MODEL: ModelId = "gemini";
/** Provider model for pictures when OPENAI_API_KEY is set. */
export const IMAGE_PROVIDER_MODEL = "gpt-image-1";

/** The Best answer merge step's model, when its provider key is set. */
export const MERGE_MODEL: { providerKey: ProviderKey; modelId: string }[] = [
  { providerKey: "openai", modelId: "gpt-5-mini" },
  { providerKey: "google", modelId: "gemini-3-flash-preview" },
  { providerKey: "anthropic", modelId: "claude-sonnet-4-0" },
];

export const modelSpec = (id: ModelId) => MODEL_SPECS[id];
