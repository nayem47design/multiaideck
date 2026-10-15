import "server-only";

import type { Locale } from "@/lib/i18n/config";
import { ApiError } from "@/lib/server/api";
import { env, has } from "@/lib/server/env";
import bn from "@/messages/bn.json";
import en from "@/messages/en.json";

// SMS adapter. Pick with SMS_PROVIDER:
//
//   console  (default) — prints the message to the server log; development only. The last message
//            per number is also kept in memory for the dev-only GET /api/dev/last-code (e2e).
//   http     — a Bangladesh bulk-SMS gateway with the common BulkSMSBD-style form API:
//              POST SMS_API_URL (e.g. http://bulksmsbd.net/api/smsapi)
//                   application/x-www-form-urlencoded
//                   api_key=SMS_API_KEY & senderid=SMS_SENDER_ID & number=8801XXXXXXXXX & message=…
//              Success: HTTP 2xx and, when the body is JSON with response_code, response_code 202.
//
// To use another gateway (SSL Wireless, Alpha SMS, Infobip…), write another `SmsSender` below and
// return it from `smsSender()`; the rest of sign-in only calls `send(to, text)`.

export interface SmsSender {
  /** `to` is E.164 (+8801…). Rejects when the gateway refuses the message. */
  send(to: string, text: string): Promise<void>;
}

const SMS_TEXT: Record<Locale, string> = {
  en: en.auth.sms.code,
  bn: bn.auth.sms.code,
};

/** The sign-in SMS in the user's language. The code stays in ASCII digits so phones can autofill it. */
export function codeText(locale: Locale, code: string, minutes: number) {
  const n =
    locale === "bn"
      ? String(minutes).replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[Number(d)])
      : String(minutes);
  return SMS_TEXT[locale].replace("{code}", code).replace("{minutes}", n);
}

// ---- console (development)

type DevOutbox = Map<string, { text: string; at: number }>;
const holder = globalThis as unknown as { __multiaiSmsOutbox?: DevOutbox };

/** Development only: the last SMS sent to a number by the console provider. */
export function devLastSms(to: string) {
  if (env.NODE_ENV === "production") return undefined;
  return holder.__multiaiSmsOutbox?.get(to);
}

export const consoleSms: SmsSender = {
  async send(to, text) {
    if (env.NODE_ENV === "production")
      throw new ApiError(503, "not_configured", "SMS is not configured");
    (holder.__multiaiSmsOutbox ??= new Map()).set(to, {
      text,
      at: Date.now(),
    });
    console.info(
      `\n┌─ SMS (console provider, development only)\n│ to:   ${to}\n│ text: ${text}\n└─\n`,
    );
  },
};

// ---- http (BulkSMSBD-style form API)

export function httpSms(config: {
  url: string;
  apiKey: string;
  senderId?: string;
}): SmsSender {
  return {
    async send(to, text) {
      const form = new URLSearchParams({
        api_key: config.apiKey,
        number: to.replace(/^\+/, ""),
        message: text,
      });
      if (config.senderId) form.set("senderid", config.senderId);
      const res = await fetch(config.url, {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: form,
        signal: AbortSignal.timeout(10_000),
      });
      const body = await res.text();
      let code: unknown;
      try {
        code = (JSON.parse(body) as { response_code?: unknown }).response_code;
      } catch {}
      if (!res.ok || (code !== undefined && Number(code) !== 202)) {
        // Never log the message itself: it holds the code.
        console.error(
          "SMS gateway refused",
          res.status,
          code ?? body.slice(0, 200),
        );
        throw new ApiError(502, "internal", "Could not send the SMS");
      }
    },
  };
}

export function smsSender(): SmsSender {
  if (has.sms())
    return httpSms({
      url: env.SMS_API_URL!,
      apiKey: env.SMS_API_KEY!,
      senderId: env.SMS_SENDER_ID,
    });
  return consoleSms;
}
