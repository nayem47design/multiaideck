"use client";

import { useFormatter } from "next-intl";
import { useSyncExternalStore } from "react";

import {
  METHOD_NAMES,
  reference,
  type Payment,
  type PaymentMethod,
} from "@/lib/payments/client";

/** 1 credit = BDT 0.01. */
const CREDIT_IN_BDT = 0.01;

const TZ = "Asia/Dhaka";

/** Number helpers for the wallet: locale digits (Bangla in /bn), taka with two decimals. */
export function useWalletFormat() {
  const format = useFormatter();
  const today = useToday();
  // Whole numbers: balances can hold fractions of a credit (answers cost 0.9 cr), but the wallet
  // shows whole credits as in Figma ("10,684 credits").
  const n = (v: number) => format.number(v, { maximumFractionDigits: 0 });
  return {
    n,
    /** Credits → taka with two decimals ("106.84"). */
    taka: (credits: number) =>
      format.number(credits * CREDIT_IN_BDT, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    method: (m: PaymentMethod) => METHOD_NAMES[m],
    date: (iso: string) =>
      format.dateTime(new Date(iso), {
        month: "short",
        day: "numeric",
        timeZone: TZ,
      }),
    time: (iso: string) =>
      format.dateTime(new Date(iso), {
        hour: "numeric",
        minute: "2-digit",
        timeZone: TZ,
      }),
    isToday: (iso: string) => today !== null && dayOf(new Date(iso)) === today,
  };
}

/** Payments as CSV rows (top-ups only show taka amounts; brand names untranslated). */
export function toCsv(header: string[], rows: (string | number)[][]) {
  const cell = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  return [header, ...rows].map((r) => r.map(cell).join(",")).join("\n");
}

export function downloadText(name: string, text: string) {
  const url = URL.createObjectURL(
    new Blob([text], { type: "text/csv;charset=utf-8" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export function usePaymentsCsv() {
  const f = useWalletFormat();
  return (payments: Payment[], header: string[]) =>
    toCsv(
      header,
      payments.map((p) => [
        `${f.date(p.createdAt)} ${f.time(p.createdAt)}`,
        p.bdt,
        METHOD_NAMES[p.method],
        p.status,
        p.status === "paid" ? p.credits : 0,
        p.status === "paid" ? reference(p) : "",
      ]),
    );
}

// Today's date in Dhaka, read only in the browser: prerendering must not read the clock.
const dayOf = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: TZ });
const noop = () => () => {};
function useToday() {
  return useSyncExternalStore(
    noop,
    () => dayOf(new Date()),
    () => null,
  );
}

// ≥ 768px shows the desktop wallet and its dialogs; below, the M-screens (docs/SCREENS.md).
const QUERY = "(min-width: 768px)";
function subscribe(onChange: () => void) {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}
export function useIsDesktop() {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false,
  );
}

/** Like useIsDesktop, but null until the browser has answered (during prerender and hydration). */
export function useIsDesktopKnown(): boolean | null {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => null,
  );
}
