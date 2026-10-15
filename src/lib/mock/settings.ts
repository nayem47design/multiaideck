// Demo data for Settings and Account (Figma: Settings · *, M13, M15, M39–M43). Values mirror the
// prototype: one "Hellow" chat on Oct 14 that cost 26 credits across three models.

import type { ModelId } from "@/lib/ai/models";

import { DEMO_MODELS } from "./demo";

/** Dates are shown in Bangladesh time. */
export const DEMO_TIME_ZONE = "Asia/Dhaka";

/** "Today" in the demo: the prototype's activity happens on Oct 14. */
export const DEMO_TODAY = "2026-10-14";

export const DEMO_SUPPORT = {
  /** Hotline from the Figma layer name ("Free call in Bangla or English: 09612-00…"). */
  phone: "+8809612000000",
  chatUrl: "mailto:support@multiaideck.com",
  termsUrl: "https://multiaideck.com/terms",
  privacyUrl: "https://multiaideck.com/privacy",
};

/** Profile preferences as saved (Figma: Settings · Profile › Preferences card). */
export const DEMO_PREFERENCES = {
  answerLanguage: "same" as "same" | "en" | "bn",
  amounts: "both" as "both" | "credits",
  density: "comfortable" as "comfortable" | "compact",
};

/** Notification choices (desktop matrix: Settings · Notifications). */
export const DEMO_NOTIFICATIONS: Record<string, Record<string, boolean>> = {
  lowBalance: { app: true, email: true },
  receipts: { app: true, email: true },
  weekly: { app: false, email: true },
  failed: { app: true, email: false },
  models: { app: true, email: false },
  offers: { app: false, email: false },
};
export const DEMO_LOW_BALANCE = {
  credits: 500,
  step: 100,
  min: 100,
  max: 5000,
};

/** Mobile notification toggles (M40). */
export const DEMO_MOBILE_NOTIFICATIONS = {
  lowBalance: true,
  longAnswers: true,
  offers: false,
};

export interface UsageModelSpend {
  model: ModelId;
  name: string;
  short: string;
  credits: number;
}

/** Spend this month by model (Figma: Usage card, M13 By AI). */
export const DEMO_USAGE_BY_MODEL: UsageModelSpend[] = [
  { ...pick("gpt"), credits: 11 },
  { ...pick("claude"), credits: 10 },
  { ...pick("gemini"), credits: 5 },
];

function pick(key: keyof typeof DEMO_MODELS) {
  const m = DEMO_MODELS[key];
  return { model: m.id, name: m.name, short: m.short };
}

export type UsageMode = "best" | "compare" | "image";

export interface UsageActivity {
  id: string;
  chatId: string;
  chat: string;
  mode: UsageMode;
  /** ISO date-time with the Dhaka offset. */
  at: string;
  credits: number;
  breakdown: { model: ModelId; name: string; credits: number }[];
}

export const DEMO_USAGE_ACTIVITY: UsageActivity[] = [
  {
    id: "hellow",
    chatId: "hellow",
    chat: "Hellow",
    mode: "best",
    at: "2026-10-14T13:29:00+06:00",
    credits: 26,
    breakdown: DEMO_USAGE_BY_MODEL.map(({ model, name, credits }) => ({
      model,
      name,
      credits,
    })),
  },
];

/** Credits spent per day, Oct 1–14 (Figma: Daily spend card). */
export const DEMO_DAILY_SPEND: { day: string; credits: number }[] = Array.from(
  { length: 14 },
  (_, i) => ({
    day: `2026-10-${String(i + 1).padStart(2, "0")}`,
    credits: i === 13 ? 26 : 0,
  }),
);

export const DEMO_USAGE_SUMMARY = {
  credits: 26,
  prompts: 1,
  chats: 1,
  refunds: 0,
  /** No spending limit set yet (Figma: "No spending limit set."). */
  limit: null as number | null,
};

/** "Easy reading" text size (M15): see src/lib/text-size.ts. */
export type { TextSize } from "@/lib/text-size";
export { TEXT_SIZE_STORAGE_KEY } from "@/lib/text-size";
