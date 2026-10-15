// The AI models MultiAIDeck compares. Names are brand names: they are not translated.

export const MODELS = {
  gpt: { name: "GPT" },
  claude: { name: "Claude" },
  gemini: { name: "Gemini" },
  deepseek: { name: "DeepSeek" },
  grok: { name: "Grok" },
} as const;

export type ModelId = keyof typeof MODELS;
export const MODEL_IDS = Object.keys(MODELS) as ModelId[];
