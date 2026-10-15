// Sign-in demo data (Phase 6 replaces it with the SMS provider). The phone number the user types
// is kept for the code step in sessionStorage, never in the URL.

import { DEMO_USER } from "./demo";

export const PHONE_PREFIX = "+880";
/** Bangladesh mobile numbers: 10 digits after +880, starting with 1 (e.g. 1712 345 214). */
export const PHONE_DIGITS = 10;
export const CODE_LENGTH = 6;
/** Seconds before "Resend code" is available again. */
export const RESEND_SECONDS = 60;

const PHONE_KEY = "multiai-sign-in-phone";

export function phoneDigits(value: string) {
  return value.replace(/\D/g, "").slice(0, PHONE_DIGITS);
}

/** "1712345214" → "1712 345 214" (4 · 3 · 3, as in Figma). */
export function formatPhone(value: string) {
  const d = phoneDigits(value);
  return [d.slice(0, 4), d.slice(4, 7), d.slice(7)].filter(Boolean).join(" ");
}

export function isValidPhone(value: string) {
  const d = phoneDigits(value);
  return d.length === PHONE_DIGITS && d.startsWith("1");
}

export function savePhone(value: string) {
  try {
    sessionStorage.setItem(PHONE_KEY, phoneDigits(value));
  } catch {}
}

export function readPhone() {
  try {
    return sessionStorage.getItem(PHONE_KEY) ?? phoneDigits(DEMO_USER.phone);
  } catch {
    return phoneDigits(DEMO_USER.phone);
  }
}
