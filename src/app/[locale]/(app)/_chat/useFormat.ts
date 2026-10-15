"use client";

import { useFormatter, useTranslations } from "next-intl";

import { CREDIT_IN_BDT } from "@/lib/mock/demo";

/** Number formatting for the chat screens (Bangla digits under /bn). */
export function useChatFormat() {
  const format = useFormatter();
  const t = useTranslations("chat");
  const n = (v: number) => format.number(v);
  /** Credits with one decimal where needed ("0.9", "14"). */
  const cr = (v: number) => format.number(v, { maximumFractionDigits: 1 });
  /** Credits → taka, two decimals, or three below ৳0.01 ("0.03", "0.003"). */
  const money = (credits: number) => {
    const bdt = credits * CREDIT_IN_BDT;
    const digits = bdt > 0 && bdt < 0.01 ? 3 : 2;
    return format.number(bdt, {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    });
  };
  /** Seconds with one decimal ("2.0"). */
  const secs = (v: number) =>
    format.number(v, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  /** "GPT, Claude and Gemini" / "GPT, Claude ও Gemini" (Figma uses no serial comma). */
  const list = (items: string[]) =>
    items.length < 2
      ? (items[0] ?? "")
      : t("and", { rest: items.slice(0, -1).join(", "), last: items.at(-1)! });
  /** "GPT, Claude, Gemini". */
  const commas = (items: string[]) => format.list(items, { type: "unit" });
  return { n, cr, secs, money, list, commas };
}
