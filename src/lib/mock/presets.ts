// Presets demo data: saved sets of AIs (Figma: Prototype › Presets). Names and descriptions are
// interface copy in messages (presets.items.<id>); models and costs live here.

import type { ModelId } from "@/lib/ai/models";

export interface DemoPreset {
  /** Built-in presets have names in messages (presets.items.<id>). */
  id: string;
  /** User presets carry their own name. */
  name?: string;
  models: ModelId[];
  /** Credits a question, low–high; a single estimate for user presets. */
  cost: [number, number] | number;
}

export const DEMO_PRESETS: DemoPreset[] = [
  { id: "recommended", models: ["gpt", "claude", "gemini"], cost: [6, 14] },
  { id: "cheapest", models: ["gemini", "deepseek", "grok"], cost: [2, 4] },
  { id: "bangla", models: ["claude", "gpt", "gemini"], cost: [6, 14] },
  { id: "writing", models: ["claude", "gpt"], cost: [5, 10] },
];

export const DEFAULT_PRESET = "recommended";
/** A preset asks up to six AIs. */
export const MAX_MODELS = 6;

const IN_USE_KEY = "multiai-preset";
const listeners = new Set<() => void>();

/** The preset in use on this device (localStorage), for the "In use" tag. */
export const presetInUse = {
  get: () => {
    try {
      return localStorage.getItem(IN_USE_KEY) ?? DEFAULT_PRESET;
    } catch {
      return DEFAULT_PRESET;
    }
  },
  set: (id: string) => {
    try {
      localStorage.setItem(IN_USE_KEY, id);
    } catch {}
    listeners.forEach((l) => l());
  },
  subscribe: (l: () => void) => {
    listeners.add(l);
    return () => listeners.delete(l);
  },
};

/** The models the preset editor (Model picker) offers, as in Figma's Model picker modal. */
export const PICKER_MODELS: {
  id: string;
  model: ModelId;
  name: string;
  provider: string;
  version: string;
  tags: (
    | "balanced"
    | "allRound"
    | "writing"
    | "longDocs"
    | "fast"
    | "imagesIn"
    | "reasoning"
    | "maths"
    | "lowCost"
    | "web"
    | "openSource"
    | "bangla"
  )[];
  speed: 1 | 2 | 3;
  credits: number;
}[] = [
  {
    id: "gpt",
    model: "gpt",
    name: "GPT-5",
    provider: "OpenAI",
    version: "GPT-5",
    tags: ["balanced", "allRound"],
    speed: 2,
    credits: 6,
  },
  {
    id: "claude",
    model: "claude",
    name: "Claude Sonnet 4",
    provider: "Anthropic",
    version: "Sonnet 4",
    tags: ["writing", "longDocs"],
    speed: 2,
    credits: 8,
  },
  {
    id: "gemini",
    model: "gemini",
    name: "Gemini 3 Flash",
    provider: "Google",
    version: "3 Flash Preview",
    tags: ["fast", "imagesIn"],
    speed: 3,
    credits: 3,
  },
  {
    id: "o3",
    model: "o3",
    name: "o3",
    provider: "OpenAI",
    version: "o3",
    tags: ["reasoning", "maths"],
    speed: 1,
    credits: 14,
  },
  {
    id: "deepseek",
    model: "deepseek",
    name: "DeepSeek",
    provider: "DeepSeek",
    version: "V3.2",
    tags: ["reasoning", "lowCost"],
    speed: 2,
    credits: 2,
  },
  {
    id: "grok",
    model: "grok",
    name: "Grok",
    provider: "xAI",
    version: "Grok 4",
    tags: ["fast", "web"],
    speed: 3,
    credits: 4,
  },
  {
    id: "perplexity",
    model: "perplexity",
    name: "Perplexity",
    provider: "Perplexity",
    version: "Sonar",
    tags: ["web"],
    speed: 2,
    credits: 5,
  },
  {
    id: "llama",
    model: "llama",
    name: "Llama",
    provider: "Meta",
    version: "Llama 4",
    tags: ["openSource", "lowCost"],
    speed: 3,
    credits: 2,
  },
  {
    id: "qwen",
    model: "qwen",
    name: "Qwen",
    provider: "Alibaba",
    version: "Qwen 3",
    tags: ["bangla", "lowCost"],
    speed: 3,
    credits: 2,
  },
];
