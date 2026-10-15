import { z } from "zod";

import { MODEL_IDS, type ModelId } from "@/lib/ai/models";

// Shared API types. Amounts cross the wire in credits (number, may be fractional, e.g. 0.9) and
// taka (number, e.g. 699); the database stores millicredits and paisa (src/lib/billing/units.ts).

export const ModelIdSchema = z.enum(MODEL_IDS as [ModelId, ...ModelId[]]);

export const API_ERROR_CODES = [
  "invalid_input",
  "unauthorized",
  "forbidden",
  "not_found",
  "rate_limited",
  "locked",
  "code_invalid",
  "code_expired",
  "insufficient_credits",
  "payment_failed",
  "not_configured",
  "conflict",
  "internal",
] as const;
export type ApiErrorCode = (typeof API_ERROR_CODES)[number];

export interface ApiErrorBody {
  error: {
    code: ApiErrorCode;
    message: string;
    details?: Record<string, unknown>;
  };
}

export const IsoDate = z.string().datetime({ offset: true });

export const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  /** What MultiAI calls the user ("Good evening, Imam"); null → first word of name. */
  preferredName: z.string().nullable(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  emailVerified: z.boolean(),
  hasPassword: z.boolean(),
  hasGoogle: z.boolean(),
  locale: z.enum(["en", "bn"]),
  answerLanguage: z.string(),
  plan: z.enum(["payg", "pro"]),
  proRenewsAt: IsoDate.nullable(),
  role: z.enum(["user", "admin"]),
  createdAt: IsoDate,
});
export type User = z.infer<typeof UserSchema>;

export const BalanceSchema = z.object({
  /** Credits, e.g. 10684. */
  credits: z.number(),
  /** Taka value, e.g. 106.84. */
  bdt: z.number(),
});
export type Balance = z.infer<typeof BalanceSchema>;
