import "server-only";

import type { PaymentProvider } from "./provider";

// The in-app sandbox checkout, used when PayStation keys are unset (development, e2e, demos).
// The person is sent to the app's own checkout (/wallet/pay?payment=<id>: the desktop dialog or
// M34 on mobile), which decides the outcome with POST /api/payments/:id/sandbox { outcome }.
// It never runs in production: assertProductionEnv() requires PayStation keys there.

export const sandbox: PaymentProvider = {
  name: "sandbox",

  async create(payment) {
    return {
      redirectUrl: `/wallet/pay?payment=${encodeURIComponent(payment.id)}`,
      raw: { provider: "sandbox", invoice: payment.invoice },
    };
  },

  // There is no outside party to ask: the sandbox decision endpoint settles the payment.
  async verify() {
    return null;
  },
};

/** A receipt-style transaction id for sandbox payments, e.g. SBX-7K2P-QW4M. */
export function sandboxTrxId() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  const pick = (i: number) => chars[bytes[i] % chars.length];
  const part = (o: number) => [0, 1, 2, 3].map((i) => pick(o + i)).join("");
  return `SBX-${part(0)}-${part(4)}`;
}
