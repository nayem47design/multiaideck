import "server-only";

import { z } from "zod";

// Server configuration, read once from the environment (never from the repo; see .env.example).
// Every external service is optional: without its keys the app uses a local stand-in, so the
// whole product runs on a laptop. Production must set them (checked by `assertProductionEnv`).

const optional = z
  .string()
  .trim()
  .transform((v) => v || undefined)
  .optional();

const schema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  /** Public origin, for payment and OAuth callbacks, e.g. https://multiaideck.com. */
  APP_URL: z.string().url().default("http://localhost:3000"),

  /** Postgres. Unset: an embedded PGlite database in .data/pglite. */
  DATABASE_URL: optional,
  /** 32+ random characters; signs nothing yet but hashes session tokens and OTP codes. */
  AUTH_SECRET: optional,

  /** SMS gateway (Bangladesh). Unset: codes are printed to the server log. */
  SMS_PROVIDER: z.enum(["console", "http"]).default("console"),
  SMS_API_URL: optional,
  SMS_API_KEY: optional,
  SMS_SENDER_ID: optional,

  /** Google sign-in. Unset: the Google button explains it's not configured. */
  GOOGLE_CLIENT_ID: optional,
  GOOGLE_CLIENT_SECRET: optional,

  /** AI providers. A model whose key is unset answers from the scripted demo model. */
  OPENAI_API_KEY: optional,
  ANTHROPIC_API_KEY: optional,
  GOOGLE_GENERATIVE_AI_API_KEY: optional,
  DEEPSEEK_API_KEY: optional,
  XAI_API_KEY: optional,

  /** PayStation (bKash, Nagad, card). Unset: the sandbox checkout in the app. */
  PAYSTATION_BASE_URL: z
    .string()
    .url()
    .default("https://sandbox.paystation.com.bd"),
  PAYSTATION_MERCHANT_ID: optional,
  PAYSTATION_PASSWORD: optional,
});

export type Env = z.infer<typeof schema>;

export const env: Env = schema.parse(process.env);

const DEV_SECRET = "dev-only-secret-change-me-dev-only-secret";

/** The secret used to hash tokens and codes; a fixed dev value outside production. */
export function authSecret() {
  return env.AUTH_SECRET ?? DEV_SECRET;
}

export const has = {
  postgres: () => !!env.DATABASE_URL,
  sms: () =>
    env.SMS_PROVIDER === "http" && !!env.SMS_API_URL && !!env.SMS_API_KEY,
  google: () => !!env.GOOGLE_CLIENT_ID && !!env.GOOGLE_CLIENT_SECRET,
  paystation: () => !!env.PAYSTATION_MERCHANT_ID && !!env.PAYSTATION_PASSWORD,
};

/** Production refuses to start on stand-ins for money, sign-in or storage. */
export function assertProductionEnv() {
  if (env.NODE_ENV !== "production") return;
  const missing = [
    !env.DATABASE_URL && "DATABASE_URL",
    !env.AUTH_SECRET && "AUTH_SECRET",
    !has.sms() && "SMS_PROVIDER=http + SMS_API_URL + SMS_API_KEY",
    !has.paystation() && "PAYSTATION_MERCHANT_ID + PAYSTATION_PASSWORD",
  ].filter(Boolean);
  if (missing.length)
    throw new Error(`Production is missing: ${missing.join(", ")}`);
}
