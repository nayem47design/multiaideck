import "server-only";

import type { payments } from "@/lib/db/schema";
import { has } from "@/lib/server/env";

import { paystation } from "./paystation";
import { sandbox } from "./sandbox";

// One interface for every payment provider. The app talks to PayStation (bKash, Nagad, card) in
// production, and to the in-app sandbox checkout when PayStation keys are unset.
//
// Rules every provider follows:
// - create() only starts a payment and returns where to send the person. It never credits.
// - verify() asks the provider, server to server, what happened. Its answer is the only thing that
//   moves a payment to paid (see ./service.ts settle()). Query parameters on a return URL and
//   webhook bodies are never trusted on their own: they only tell us *which* payment to re-check.

export type PaymentRow = typeof payments.$inferSelect;

export interface Customer {
  name: string;
  phone: string | null;
  email: string | null;
}

export interface CreateResult {
  /** Absolute provider URL, or an in-app path (sandbox) without the locale prefix. */
  redirectUrl: string;
  /** Provider response, recorded in payment_events. */
  raw?: unknown;
}

export type VerifiedStatus = "paid" | "failed" | "cancelled" | "pending";

export interface Verification {
  status: VerifiedStatus;
  /** Provider's transaction id (shown on receipts). */
  trxId?: string | null;
  /** Amount the provider says was paid, in paisa, when it reports one. */
  amountPaisa?: number | null;
  /** Provider wording, for failed payments. */
  reason?: string | null;
  /** The provider response, recorded in payment_events. */
  raw: unknown;
}

export interface PaymentProvider {
  readonly name: PaymentRow["provider"];
  create(payment: PaymentRow, customer: Customer): Promise<CreateResult>;
  /** null when the provider has no server-side status (the sandbox decides in-app). */
  verify(payment: PaymentRow): Promise<Verification | null>;
}

/** The provider for new payments: PayStation when its keys are set, else the sandbox. */
export function currentProvider(): PaymentProvider {
  return has.paystation() ? paystation : sandbox;
}

/** The provider an existing payment was made with. */
export function providerFor(payment: PaymentRow): PaymentProvider {
  return payment.provider === "paystation" ? paystation : sandbox;
}
