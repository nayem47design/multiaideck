import { z } from "zod";

import { BalanceSchema, UserSchema } from "./common";

// Sign-in: phone + 6-digit SMS code, Google as an option.
//
// POST /api/auth/code          SendCodeRequest → SendCodeResponse   (429 rate_limited, 423 locked)
// POST /api/auth/verify        VerifyCodeRequest → MeResponse       (400 code_invalid / code_expired, 423 locked)
// GET  /api/auth/google        → redirect to Google (503 not_configured without keys)
// GET  /api/auth/google/callback → sets the session, redirects to /
// POST /api/auth/sign-out      → 204
// GET  /api/me                 → MeResponse (401 when signed out)

/** Bangladesh mobile number, 10 digits after +880, starting with 1 (e.g. 1712345214). */
export const BdPhoneSchema = z
  .string()
  .transform((v) => v.replace(/[\s-]/g, "").replace(/^(\+?880|0)/, ""))
  .pipe(z.string().regex(/^1[3-9]\d{8}$/, "Enter a Bangladesh mobile number"));

export const SendCodeRequest = z.object({ phone: BdPhoneSchema });
export type SendCodeRequest = z.input<typeof SendCodeRequest>;

export const SendCodeResponse = z.object({
  /** E.164, e.g. +8801712345214. */
  sentTo: z.string(),
  /** Seconds until another code can be sent. */
  resendIn: z.number(),
  expiresIn: z.number(),
});
export type SendCodeResponse = z.infer<typeof SendCodeResponse>;

export const VerifyCodeRequest = z.object({
  phone: BdPhoneSchema,
  code: z.string().regex(/^\d{6}$/),
});
export type VerifyCodeRequest = z.input<typeof VerifyCodeRequest>;

export const MeResponse = z.object({
  user: UserSchema,
  balance: BalanceSchema,
  /** True on the first sign-in, so the app can welcome the user. */
  isNew: z.boolean().optional(),
});
export type MeResponse = z.infer<typeof MeResponse>;
