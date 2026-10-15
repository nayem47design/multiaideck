// Fixed demo data for the screens until the backend lands (Phase 6). It mirrors the Figma
// prototype: the coffee-shop chat and 10,684 credits. User content (names, chat titles, AI
// answers) lives here; interface copy lives in src/messages.

import type { ModelId } from "@/lib/ai/models";

export const DEMO_USER = {
  name: "Al Imam Hossain",
  firstName: "Imam",
  email: "alhossain@musemind.agency",
  initials: "AH",
  /** Shown with the +880 prefix. */
  phone: "1712 345 214",
};

/** 1 credit = BDT 0.01. */
export const CREDIT_IN_BDT = 0.01;

export const DEMO_BALANCE = {
  credits: 10684,
  /** Share of the last top-up left, for the sidebar progress bar. */
  progress: 60,
};

/** The answer models the prototype uses, with display names (brand names are not translated). */
export const DEMO_MODELS: Record<
  "gpt" | "claude" | "gemini",
  { id: ModelId; name: string; short: string; provider: string }
> = {
  gpt: { id: "gpt", name: "GPT-5", short: "GPT-5", provider: "OpenAI" },
  claude: {
    id: "claude",
    name: "Claude Sonnet 4",
    short: "Claude",
    provider: "Anthropic",
  },
  gemini: {
    id: "gemini",
    name: "Gemini 3 Flash",
    short: "Gemini",
    provider: "Google",
  },
};

export type ChatKind = "compare" | "best" | "image";

export interface DemoChat {
  id: string;
  title: string;
  kind: ChatKind;
  models: ModelId[];
  /** Number of prompts in the chat. */
  prompts: number;
  credits: number;
  /** "today" or "yesterday", for grouping. */
  day: "today" | "yesterday";
  /** Display time or weekday, as in Figma ("11:40", "Tue"). */
  time: string;
  /** A line from the first prompt, for search results. */
  snippet: string;
}

export const DEMO_CHATS: DemoChat[] = [
  {
    id: "coffee-shop-names",
    title: "Coffee shop names",
    kind: "compare",
    models: ["gpt", "claude", "gemini"],
    prompts: 3,
    credits: 6.9,
    day: "today",
    time: "11:40",
    snippet: "Give me 3 name ideas for a small coffee shop in Dhaka",
  },
  {
    id: "golpo-coffee-sign",
    title: "Golpo Coffee sign",
    kind: "image",
    models: [],
    prompts: 1,
    credits: 40,
    day: "today",
    time: "11:20",
    snippet: "A cosy coffee shop sign that says “Golpo Coffee”, warm colours",
  },
  {
    id: "hellow",
    title: "Hellow",
    kind: "best",
    models: ["gpt", "claude", "gemini"],
    prompts: 1,
    credits: 0.9,
    day: "today",
    time: "9:12",
    snippet: "Hellow",
  },
  {
    id: "who-are-you",
    title: "Who are you?",
    kind: "compare",
    models: ["gpt", "claude", "gemini"],
    prompts: 1,
    credits: 14,
    day: "yesterday",
    time: "Tue",
    snippet: "Who are you?",
  },
  {
    id: "how-old-are-you",
    title: "How old are you",
    kind: "best",
    models: ["gemini"],
    prompts: 1,
    credits: 4,
    day: "yesterday",
    time: "Tue",
    snippet: "How old are you",
  },
];

/** Chats shown in the sidebar (Figma lists the text chats under "Today"). */
export const SIDEBAR_CHATS = DEMO_CHATS.filter((c) => c.kind !== "image");

/** Credits → BDT, formatted with two decimals ("106.84"). */
export function creditsToBdt(credits: number) {
  return (credits * CREDIT_IN_BDT).toFixed(2);
}
