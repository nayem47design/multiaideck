import { z } from "zod";

import { BalanceSchema, IsoDate } from "./common";

// Wallet, top-ups (PayStation: bKash, Nagad, card), Pro.
//
// GET  /api/wallet                      → WalletResponse
// GET  /api/wallet/packs                → PacksResponse
// GET  /api/payments                    → PaymentListResponse
// POST /api/payments                    CreatePaymentRequest → CreatePaymentResponse
// GET  /api/payments/:id                → PaymentSchema (also re-checks a pending PayStation payment)
// POST /api/payments/:id/sandbox        SandboxDecision → PaymentSchema   (sandbox provider only)
// GET  /api/payments/paystation/return  ?invoice=… → redirects to /wallet/paid or /wallet/failed
// POST /api/payments/paystation/webhook PayStation IPN → 200
//
// Credits are added only after the server verifies the payment with the provider (webhook or a
// server-side status check), never from the browser's return page. Each payment credits once.

export const MethodSchema = z.enum(["bkash", "nagad", "card"]);
export type Method = z.infer<typeof MethodSchema>;

export const PackSchema = z.object({
  id: z.string(),
  bdt: z.number(),
  credits: z.number(),
  bonusPercent: z.number(),
  bonusCredits: z.number(),
  tag: z.enum(["most-chosen"]).nullable(),
});
export type Pack = z.infer<typeof PackSchema>;
export const PacksResponse = z.object({
  packs: z.array(PackSchema),
  /** Smallest custom amount, BDT. */
  minCustomBdt: z.number(),
  /** Largest custom amount, BDT (more is the Teams plan). */
  maxCustomBdt: z.number(),
  pro: z.object({ bdt: z.number(), credits: z.number() }),
});
export type PacksResponse = z.infer<typeof PacksResponse>;

export const PaymentStatus = z.enum(["pending", "paid", "failed", "cancelled"]);

export const PaymentSchema = z.object({
  id: z.string(),
  invoice: z.string(),
  kind: z.enum(["topup", "pro"]),
  method: MethodSchema,
  provider: z.enum(["paystation", "sandbox"]),
  bdt: z.number(),
  credits: z.number(),
  bonusCredits: z.number(),
  status: PaymentStatus,
  failureReason: z.string().nullable(),
  providerTrxId: z.string().nullable(),
  createdAt: IsoDate,
});
export type Payment = z.infer<typeof PaymentSchema>;

export const CreatePaymentRequest = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("topup"),
    method: MethodSchema,
    /** A pack id, or a custom amount in BDT. */
    packId: z.string().optional(),
    customBdt: z.number().int().positive().optional(),
  }),
  z.object({ kind: z.literal("pro"), method: MethodSchema }),
]);
export type CreatePaymentRequest = z.infer<typeof CreatePaymentRequest>;

export const CreatePaymentResponse = z.object({
  payment: PaymentSchema,
  /** Where to send the user: PayStation's page, or the in-app sandbox checkout. */
  redirectUrl: z.string(),
});
export type CreatePaymentResponse = z.infer<typeof CreatePaymentResponse>;

export const SandboxDecision = z.object({
  outcome: z.enum(["paid", "failed", "cancelled"]),
});

export const PaymentListResponse = z.object({
  payments: z.array(PaymentSchema),
});

export const WalletResponse = z.object({
  balance: BalanceSchema,
  plan: z.enum(["payg", "pro"]),
  proRenewsAt: IsoDate.nullable(),
  spentThisMonth: BalanceSchema,
  chatsThisMonth: z.number(),
  /** Average credits per prompt (last 90 days). */
  averagePromptCredits: z.number().nullable(),
  /** Average credits per chat (last 90 days), for "about N chats". */
  averageChatCredits: z.number().nullable(),
});
export type WalletResponse = z.infer<typeof WalletResponse>;
