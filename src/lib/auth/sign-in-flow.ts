// The phone sign-in flow in the browser: the number typed on /sign-in, when another code may be
// sent, and where to go afterwards pass to /sign-in/code in sessionStorage (never in the URL).

import type { ApiClientError } from "@/lib/api-client";

import { safeNext } from "./cookies";

export const PHONE_PREFIX = "+880";
/** Bangladesh mobile numbers: 10 digits after +880, starting with 1 (e.g. 1712 345 214). */
export const PHONE_DIGITS = 10;
export const CODE_LENGTH = 6;

export const FLOW_KEY = "multiai-sign-in";

export interface SignInFlow {
  /** National digits, e.g. "1712345214". */
  phone: string;
  /** Epoch ms when "Resend code" becomes available. */
  resendAt: number;
  /** In-app path to open after signing in. */
  next: string;
}

export function phoneDigits(value: string) {
  return value
    .replace(/\D/g, "")
    .replace(/^(880|0)(?=1)/, "")
    .slice(0, PHONE_DIGITS);
}

/** "1712345214" → "1712 345 214" (4 · 3 · 3, as in Figma). */
export function formatPhone(value: string) {
  const d = phoneDigits(value);
  return [d.slice(0, 4), d.slice(4, 7), d.slice(7)].filter(Boolean).join(" ");
}

export function isValidPhone(value: string) {
  return /^1[3-9]\d{8}$/.test(phoneDigits(value));
}

export function saveFlow(flow: SignInFlow) {
  try {
    sessionStorage.setItem(FLOW_KEY, JSON.stringify(flow));
  } catch {}
}

export function readFlow(): SignInFlow | null {
  try {
    const f = JSON.parse(
      sessionStorage.getItem(FLOW_KEY) ?? "null",
    ) as SignInFlow;
    if (!f || !isValidPhone(f.phone)) return null;
    return { ...f, next: safeNext(f.next) };
  } catch {
    return null;
  }
}

export function clearFlow() {
  try {
    sessionStorage.removeItem(FLOW_KEY);
  } catch {}
}

/** Seconds from an API error's details.retryAfter, at least 1. */
export function retryAfter(e: ApiClientError) {
  const s = Number(e.details?.retryAfter);
  return Number.isFinite(s) && s > 0 ? Math.ceil(s) : 60;
}

/** In-app path with the locale prefix ("/wallet" + bn → "/bn/wallet"). */
export function localePath(path: string, locale: string) {
  if (locale !== "bn") return path;
  return path === "/" ? "/bn" : `/bn${path}`;
}
