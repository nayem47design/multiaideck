// Demo data for the ask-and-compare screens (Home, /c/[id]) until the backend lands. It mirrors the
// Figma prototype: the coffee-shop chat with three prompts, a slow second prompt and a catch-up
// third prompt. Interface copy (badges, notes, buttons) lives in src/messages; this file holds only
// user content and numbers.
//
// Each answer is independent (AGENTS.md rule 7): every model's text is written for that model
// alone, and no answer is built from another model's answer. The Best answer view lists the
// strongest ideas and names the model each one came from; it is display-only.

import type { ModelId } from "@/lib/ai/models";

import { DEMO_CHATS, DEMO_MODELS, type DemoChat } from "./demo";

export type AnswerModel = keyof typeof DEMO_MODELS;
export const ANSWER_MODELS: AnswerModel[] = ["gpt", "claude", "gemini"];

/** Why an answer could not be given. */
export type FailureKind = "timeout" | "unavailable";

/**
 * A short label next to an answer's metrics. Names map to `chat.badge.*` (desktop) and
 * `chat.note.*` (mobile) messages.
 */
export type AnswerTag =
  "suggested" | "fastestCheapest" | "only" | "retried" | "caughtUp";

export interface DemoAnswer {
  model: AnswerModel;
  /** Absent when the model failed. */
  text?: string;
  failure?: FailureKind;
  seconds?: number;
  tokens?: number;
  credits?: number;
  tag?: AnswerTag;
  /** Retry price shown on a failed card. */
  retryCredits?: number;
}

export interface DemoPrompt {
  text: string;
  answers: DemoAnswer[];
}

export interface BestIdea {
  name: string;
  text: string;
  model: AnswerModel;
}

export interface DemoBestAnswer {
  intro: string;
  ideas: BestIdea[];
  seconds: number;
  tokens: number;
  credits: number;
}

// ---- Coffee-shop chat --------------------------------------------------------------------------

const P1: DemoPrompt = {
  text: "Give me 3 name ideas for a small coffee shop in Dhaka",
  answers: [
    {
      model: "gpt",
      text: "Here are three ideas:\n\n1. Brew Lane: simple and easy to remember.\n2. Cha & Crema: mixes Dhaka’s tea culture with espresso.\n3. Dhaka Drip: local, modern and short.",
      seconds: 1.8,
      tokens: 96,
      credits: 0.9,
    },
    {
      model: "claude",
      text: "Three ideas, with the feeling each one gives:\n\n1. Golpo Coffee: “golpo” means story, a place to sit and talk.\n2. Third Place: for people who stay and work.\n3. Morning Ritual: calm and a little premium.\n\nWant me to check which names are free as Facebook pages?",
      seconds: 2.6,
      tokens: 142,
      credits: 1.4,
      tag: "suggested",
    },
    {
      model: "gemini",
      text: "1. Bean Bari (“bari” means home)\n2. Cup & Chai\n3. Roast Dhaka",
      seconds: 0.9,
      tokens: 58,
      credits: 0.3,
      tag: "fastestCheapest",
    },
  ],
};

const P2_CLAUDE: DemoAnswer = {
  model: "claude",
  text: "More premium takes on the same three:\n\n1. Golpo Reserve: same story, a quieter, richer feel.\n2. The Third Place Roastery\n3. Ritual & Co.",
  seconds: 2.3,
  tokens: 128,
  credits: 1.3,
  tag: "only",
};

const P2_GEMINI: DemoAnswer = {
  model: "gemini",
  failure: "unavailable",
  retryCredits: 0.3,
};

const P2: DemoPrompt = {
  text: "Make them sound more premium",
  answers: [
    { model: "gpt", failure: "timeout", retryCredits: 0.9 },
    P2_CLAUDE,
    P2_GEMINI,
  ],
};

/** Prompt 2 after GPT-5 answered on retry (Gemini is still unavailable). */
const P2_RETRIED: DemoPrompt = {
  text: P2.text,
  answers: [
    {
      model: "gpt",
      text: "Premium names for a Dhaka coffee shop:\n\n1. Ember & Oak\n2. The Gulshan Roast House\n3. Velvet Bean",
      seconds: 2.0,
      tokens: 110,
      credits: 1.2,
      tag: "retried",
    },
    P2_CLAUDE,
    P2_GEMINI,
  ],
};

const P3: DemoPrompt = {
  text: "Add a Bangla tagline to each",
  answers: [
    {
      model: "gpt",
      text: "1. Ember & Oak\n“আগুনে সেঁকা স্বাদ”\n2. The Gulshan Roast House\n“গুলশানের কফির ঘর”\n3. Velvet Bean\n“মখমলের মতো মোলায়েম”",
      seconds: 2.0,
      tokens: 110,
      credits: 1.2,
      tag: "caughtUp",
    },
    {
      model: "claude",
      text: "1. Golpo Reserve\n“গল্প জমুক এখানে”\n2. The Third Place Roastery\n“কাজ আর কফি, একসাথে”\n3. Ritual & Co.\n“প্রতিদিনের শান্ত শুরু”",
      seconds: 2.3,
      tokens: 128,
      credits: 1.3,
      tag: "suggested",
    },
    {
      model: "gemini",
      text: "1. Bari Reserve\n“ঘরের মতো কফি”\n2. Chai Noir\n“চায়ের দেশে কালো কফি”\n3. Saffron Roastery\n“জাফরানি সকাল”",
      seconds: 1.1,
      tokens: 74,
      credits: 0.4,
      tag: "caughtUp",
    },
  ],
};

const P1_BEST: DemoBestAnswer = {
  intro: "Here are the strongest name ideas from all three models:",
  ideas: [
    {
      name: "Golpo Coffee",
      text: "“Golpo” means story: a place to sit and talk.",
      model: "claude",
    },
    {
      name: "Bean Bari",
      text: "“Bari” means home: warm and local.",
      model: "gemini",
    },
    {
      name: "Cha & Crema",
      text: "Dhaka’s tea culture meets espresso.",
      model: "gpt",
    },
  ],
  seconds: 3.1,
  tokens: 286,
  credits: 2.8,
};

/** Text the demo voice input "hears" (Figma: Voice listening). */
export const DEMO_VOICE = {
  home: "Give me coffee shop names that feel local to Dhaka, maybe with a Bangla word",
  best: "Make the second name shorter and add a Bangla tagline",
  compare: "Which of these names works best for a Facebook page?",
  /** Input levels for the waveform, 0–1 (Figma: Composer › Voice listening › Waveform). */
  levels: [
    6, 10, 16, 22, 14, 8, 18, 24, 12, 6, 10, 20, 26, 16, 8, 12, 18, 10, 0, 0, 0,
    0,
  ].map((h) => h / 26),
  /** Taller bars for the mobile voice screen (M4). */
  levelsMobile: [10, 18, 30, 44, 26, 14, 34, 48, 22, 12, 28, 40, 18, 10, 6].map(
    (h) => h / 48,
  ),
};

/** Files the demo "attaches" (Figma: Composer › Attachment, M19). */
export const DEMO_FILES = [
  {
    id: "menu",
    name: "Menu-draft.pdf",
    kind: "file" as const,
    type: "PDF",
    size: "1.2 MB",
  },
  {
    id: "storefront",
    name: "storefront.jpg",
    kind: "image" as const,
    type: "JPG",
    size: "2.4 MB",
    /** Upload progress in the desktop frame. */
    progress: 64,
  },
];

/** The follow-up the prototype types after prompt 2 (Figma: Writing prompt 3). */
export const DEMO_NEXT_PROMPT = P3.text;

export interface ChatScript {
  /** Prompts in order; the Compare states show one prompt at a time. */
  prompts: {
    p1: DemoPrompt;
    p2: DemoPrompt;
    p2Retried: DemoPrompt;
    p3: DemoPrompt;
  };
  best: DemoBestAnswer;
  /** Catch-up cost when a follow-up goes to AIs that missed the last prompt. */
  catchUpCredits: number;
  /** "All 3" follow-up estimate (M9). */
  followUpAllCredits: number;
}

export const COFFEE_CHAT: ChatScript = {
  prompts: { p1: P1, p2: P2, p2Retried: P2_RETRIED, p3: P3 },
  best: P1_BEST,
  catchUpCredits: 0.5,
  followUpAllCredits: 3,
};

// ---- The other demo chats (one prompt each) ----------------------------------------------------

const SIMPLE: Record<string, { prompt: DemoPrompt; best: DemoBestAnswer }> = {
  hellow: {
    prompt: {
      text: "Hellow",
      answers: [
        {
          model: "gpt",
          text: "Hello! How can I help you today?",
          seconds: 0.8,
          tokens: 12,
          credits: 0.2,
        },
        {
          model: "claude",
          text: "Hi there. What would you like to work on?",
          seconds: 1.1,
          tokens: 14,
          credits: 0.4,
          tag: "suggested",
        },
        {
          model: "gemini",
          text: "Hey! Ask me anything.",
          seconds: 0.5,
          tokens: 8,
          credits: 0.1,
          tag: "fastestCheapest",
        },
      ],
    },
    best: {
      intro: "A friendly hello from all three models:",
      ideas: [
        {
          name: "Hi there",
          text: "What would you like to work on?",
          model: "claude",
        },
        { name: "Hello", text: "How can I help you today?", model: "gpt" },
        { name: "Hey", text: "Ask me anything.", model: "gemini" },
      ],
      seconds: 1.2,
      tokens: 34,
      credits: 0.9,
    },
  },
  "who-are-you": {
    prompt: {
      text: "Who are you?",
      answers: [
        {
          model: "gpt",
          text: "I’m GPT-5, an AI model made by OpenAI. I can help you write, plan and answer questions.",
          seconds: 1.4,
          tokens: 40,
          credits: 4,
        },
        {
          model: "claude",
          text: "I’m Claude, an AI assistant made by Anthropic. I’m good at careful writing and long documents.",
          seconds: 1.9,
          tokens: 44,
          credits: 6,
          tag: "suggested",
        },
        {
          model: "gemini",
          text: "I’m Gemini, a model from Google. I’m quick and can also read images.",
          seconds: 0.7,
          tokens: 30,
          credits: 4,
          tag: "fastestCheapest",
        },
      ],
    },
    best: {
      intro: "Each model introduced itself:",
      ideas: [
        {
          name: "Claude",
          text: "Careful writing and long documents.",
          model: "claude",
        },
        {
          name: "GPT-5",
          text: "Writing, planning and questions.",
          model: "gpt",
        },
        {
          name: "Gemini",
          text: "Quick, and can read images.",
          model: "gemini",
        },
      ],
      seconds: 2.0,
      tokens: 114,
      credits: 14,
    },
  },
  "how-old-are-you": {
    prompt: {
      text: "How old are you",
      answers: [
        {
          model: "gemini",
          text: "I don’t have an age the way people do. I’m a model that Google updates over time.",
          seconds: 0.9,
          tokens: 28,
          credits: 4,
        },
      ],
    },
    best: {
      intro: "Gemini’s answer:",
      ideas: [
        {
          name: "No age",
          text: "A model that is updated over time.",
          model: "gemini",
        },
      ],
      seconds: 0.9,
      tokens: 28,
      credits: 4,
    },
  },
};

export const COFFEE_CHAT_ID = "coffee-shop-names";

/** Text chats that /c/[id] renders (image chats belong to Image studio). */
export const TEXT_CHATS = DEMO_CHATS.filter((c) => c.kind !== "image");

export function findChat(id: string): DemoChat | undefined {
  return TEXT_CHATS.find((c) => c.id === id);
}

/** A one-prompt chat that is not the scripted coffee-shop chat. */
export function simpleChat(id: string) {
  return SIMPLE[id];
}

export function modelInfo(model: AnswerModel | ModelId) {
  return DEMO_MODELS[model as AnswerModel];
}

/** Sum of credits charged for a prompt (failed answers are refunded). */
export function promptCredits(prompt: DemoPrompt) {
  return (
    Math.round(
      prompt.answers.reduce(
        (sum, a) => sum + (a.text ? (a.credits ?? 0) : 0),
        0,
      ) * 10,
    ) / 10
  );
}

/** The cheapest answered model of a prompt. */
export function cheapest(prompt: DemoPrompt) {
  return prompt.answers
    .filter((a) => a.text)
    .reduce<DemoAnswer | undefined>(
      (min, a) => (!min || (a.credits ?? 0) < (min.credits ?? 0) ? a : min),
      undefined,
    );
}

/** Model picker rows (desktop modal and the mobile Choose AIs sheet). */
export const PICKER_MODELS: {
  id: ModelId;
  name: string;
  provider: string;
  version: string;
  /** Message keys under picker.tags. */
  tags: string[];
  speed: 1 | 2 | 3;
  /** Typical credits per short answer (desktop column). */
  cost: number;
  /** Typical credits per answer on mobile (M25). */
  costMobile?: number;
}[] = [
  {
    id: "gpt",
    name: "GPT-5",
    provider: "OpenAI",
    version: "GPT-5",
    tags: ["balanced", "allRound"],
    speed: 2,
    cost: 6,
    costMobile: 1,
  },
  {
    id: "claude",
    name: "Claude Sonnet 4",
    provider: "Anthropic",
    version: "Sonnet 4",
    tags: ["writing", "longDocs"],
    speed: 2,
    cost: 8,
    costMobile: 1.4,
  },
  {
    id: "gemini",
    name: "Gemini 3 Flash",
    provider: "Google",
    version: "3 Flash Preview",
    tags: ["fast", "imagesIn"],
    speed: 3,
    cost: 3,
    costMobile: 0.3,
  },
  {
    id: "o3",
    name: "o3",
    provider: "OpenAI",
    version: "o3",
    tags: ["reasoning", "maths"],
    speed: 1,
    cost: 14,
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    provider: "DeepSeek",
    version: "V3.2",
    tags: ["reasoning", "lowCost"],
    speed: 2,
    cost: 2,
    costMobile: 0.4,
  },
  {
    id: "perplexity",
    name: "Perplexity",
    provider: "Perplexity",
    version: "Sonar Pro",
    tags: ["webSearch", "sources"],
    speed: 2,
    cost: 5,
  },
  {
    id: "grok",
    name: "Grok",
    provider: "xAI",
    version: "4.20",
    tags: ["realTime"],
    speed: 2,
    cost: 7,
    costMobile: 0.8,
  },
  {
    id: "llama",
    name: "Llama",
    provider: "Meta",
    version: "4 Scout",
    tags: ["fast", "openSource"],
    speed: 3,
    cost: 1,
  },
  {
    id: "qwen",
    name: "Qwen",
    provider: "Alibaba",
    version: "3.5 Plus",
    tags: ["multilingual"],
    speed: 2,
    cost: 2,
  },
];

/** The five models the mobile Choose AIs sheet lists (M25). */
export const MOBILE_PICKER_IDS: ModelId[] = [
  "gpt",
  "claude",
  "gemini",
  "deepseek",
  "grok",
];
