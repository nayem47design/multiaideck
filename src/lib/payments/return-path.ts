import "server-only";

import { eq } from "drizzle-orm";

import type { Db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { defaultLocale, locales, type Locale } from "@/lib/i18n/config";

import type { PaymentRow } from "./provider";

/** next-intl's locale cookie (set when the person switches language). */
const LOCALE_COOKIE = "NEXT_LOCALE";

function cookieLocale(req: Request): Locale | null {
  const raw = req.headers.get("cookie") ?? "";
  const m = raw.match(new RegExp(`(?:^|;\\s*)${LOCALE_COOKIE}=([^;]+)`));
  const v = m?.[1];
  return v && (locales as readonly string[]).includes(v) ? (v as Locale) : null;
}

/** Where to send the browser after a provider return, in the person's language. */
export async function returnPath(
  db: Db,
  req: Request,
  payment: PaymentRow | null,
) {
  let locale = cookieLocale(req);
  if (!locale && payment) {
    const [u] = await db
      .select({ locale: users.locale })
      .from(users)
      .where(eq(users.id, payment.userId));
    locale = u?.locale ?? null;
  }
  const prefix =
    (locale ?? defaultLocale) === defaultLocale ? "" : `/${locale}`;
  if (!payment) return `${prefix}/wallet`;
  const q = `?payment=${encodeURIComponent(payment.id)}`;
  if (payment.status === "paid") return `${prefix}/wallet/paid${q}`;
  if (payment.status === "pending") return `${prefix}/wallet/pay${q}`;
  return `${prefix}/wallet/failed${q}`;
}
