// The AI models MultiAIDeck compares. Names are brand names: they are not translated.
// The first five have Model orb components in Figma; the rest appear only in the Model picker.

export const MODELS = {
  gpt: { name: "GPT" },
  claude: { name: "Claude" },
  gemini: { name: "Gemini" },
  deepseek: { name: "DeepSeek" },
  grok: { name: "Grok" },
  o3: { name: "o3" },
  perplexity: { name: "Perplexity" },
  llama: { name: "Llama" },
  qwen: { name: "Qwen" },
} as const;

export type ModelId = keyof typeof MODELS;
export const MODEL_IDS = Object.keys(MODELS) as ModelId[];
