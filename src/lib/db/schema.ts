import { sql } from "drizzle-orm";
import {
  bigint,
  bigserial,
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import type { ModelId } from "@/lib/ai/models";

// Database schema (Postgres; PGlite locally). Amounts are integers: credits in millicredits
// (mcr), taka in paisa; see src/lib/billing/units.ts.
//
// ledger_entries is append-only (AGENTS.md rule 8): a trigger in the first migration rejects
// UPDATE and DELETE. Corrections are new entries. The balance is the sum of amount_mcr.

const id = () =>
  text("id")
    .primaryKey()
    .default(sql`gen_random_uuid()::text`);
const createdAt = () =>
  timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAt = () =>
  timestamp("updated_at", { withTimezone: true }).notNull().defaultNow();

// ---- Accounts

export const users = pgTable(
  "users",
  {
    id: id(),
    /** E.164, e.g. +8801712345214. */
    phone: text("phone"),
    email: text("email"),
    emailVerified: boolean("email_verified").notNull().default(false),
    googleSub: text("google_sub"),
    /** Bcrypt-style password hash (scrypt), for the optional email + password sign-in. */
    passwordHash: text("password_hash"),
    name: text("name").notNull().default(""),
    locale: text("locale", { enum: ["en", "bn"] })
      .notNull()
      .default("en"),
    answerLanguage: text("answer_language").notNull().default("auto"),
    plan: text("plan", { enum: ["payg", "pro"] })
      .notNull()
      .default("payg"),
    proRenewsAt: timestamp("pro_renews_at", { withTimezone: true }),
    role: text("role", { enum: ["user", "admin"] })
      .notNull()
      .default("user"),
    /** Low-balance alert threshold, in credits. */
    lowBalanceAlert: integer("low_balance_alert").notNull().default(500),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("users_phone_key")
      .on(t.phone)
      .where(sql`deleted_at is null`),
    uniqueIndex("users_email_key")
      .on(t.email)
      .where(sql`deleted_at is null`),
    uniqueIndex("users_google_key")
      .on(t.googleSub)
      .where(sql`deleted_at is null`),
  ],
);

export const sessions = pgTable(
  "sessions",
  {
    /** SHA-256 of the session token; the token itself only lives in the cookie. */
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    userAgent: text("user_agent"),
    createdAt: createdAt(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);

/** SMS sign-in codes. Rate limits and lockouts are counted from these rows. */
export const otpCodes = pgTable(
  "otp_codes",
  {
    id: id(),
    phone: text("phone").notNull(),
    /** HMAC of the code; the code itself is only sent by SMS. */
    codeHash: text("code_hash").notNull(),
    ip: text("ip"),
    attempts: integer("attempts").notNull().default(0),
    createdAt: createdAt(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    consumedAt: timestamp("consumed_at", { withTimezone: true }),
  },
  (t) => [index("otp_phone_idx").on(t.phone, t.createdAt)],
);

// ---- Chats

export const chats = pgTable(
  "chats",
  {
    id: id(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    title: text("title").notNull(),
    kind: text("kind", { enum: ["best", "compare", "image"] }).notNull(),
    pinned: boolean("pinned").notNull().default(false),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [index("chats_user_idx").on(t.userId, t.updatedAt)],
);

export const prompts = pgTable(
  "prompts",
  {
    id: id(),
    chatId: text("chat_id")
      .notNull()
      .references(() => chats.id),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    /** 1, 2, 3… within the chat. */
    seq: integer("seq").notNull(),
    text: text("text").notNull(),
    mode: text("mode", { enum: ["best", "compare"] }).notNull(),
    /** Models asked, in display order. */
    models: jsonb("models").$type<ModelId[]>().notNull(),
    attachments: jsonb("attachments")
      .$type<{ name: string; kind: "file" | "image"; size: number }[]>()
      .notNull()
      .default([]),
    status: text("status", { enum: ["running", "done", "stopped"] })
      .notNull()
      .default("running"),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("prompts_chat_seq_key").on(t.chatId, t.seq)],
);

/**
 * One model's answer to one prompt. Each answer is independent (AGENTS.md rule 7): a model only
 * ever sees the user's prompts and its own earlier answers in this chat.
 */
export const answers = pgTable(
  "answers",
  {
    id: id(),
    promptId: text("prompt_id")
      .notNull()
      .references(() => prompts.id),
    chatId: text("chat_id")
      .notNull()
      .references(() => chats.id),
    model: text("model").$type<ModelId>().notNull(),
    /** Provider model id actually called, e.g. gpt-5, or "demo". */
    modelVersion: text("model_version").notNull(),
    status: text("status", {
      enum: ["queued", "catching-up", "streaming", "done", "failed", "stopped"],
    })
      .notNull()
      .default("queued"),
    failure: text("failure", {
      enum: ["timeout", "unavailable", "error", "stopped"],
    }),
    text: text("text").notNull().default(""),
    inputTokens: integer("input_tokens").notNull().default(0),
    outputTokens: integer("output_tokens").notNull().default(0),
    /** Tokens spent first reading earlier prompts the model missed (shown as its own line). */
    catchUpTokens: integer("catch_up_tokens").notNull().default(0),
    costMcr: bigint("cost_mcr", { mode: "number" }).notNull().default(0),
    catchUpCostMcr: bigint("catch_up_cost_mcr", { mode: "number" })
      .notNull()
      .default(0),
    /** The failed answer this one retries, if any. */
    retryOf: text("retry_of"),
    durationMs: integer("duration_ms"),
    startedAt: timestamp("started_at", { withTimezone: true }),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [
    index("answers_prompt_idx").on(t.promptId),
    index("answers_chat_idx").on(t.chatId, t.model),
  ],
);

/** Best answer mode: the merge step's output, citing which model each part came from. */
export const bestAnswers = pgTable("best_answers", {
  promptId: text("prompt_id")
    .primaryKey()
    .references(() => prompts.id),
  status: text("status", { enum: ["streaming", "done", "failed"] })
    .notNull()
    .default("streaming"),
  intro: text("intro").notNull().default(""),
  points: jsonb("points")
    .$type<{ lead: string; text: string; model: ModelId }[]>()
    .notNull()
    .default([]),
  costMcr: bigint("cost_mcr", { mode: "number" }).notNull().default(0),
  durationMs: integer("duration_ms"),
  createdAt: createdAt(),
});

// ---- Credits ledger (append-only)

export const LEDGER_KINDS = [
  "topup", // a verified payment
  "bonus", // pack bonus credits
  "pro_grant", // monthly Pro credits
  "reserve", // estimate held when a prompt starts (negative)
  "release", // reserve returned when the answer finishes, fails or stops (positive)
  "charge", // actual cost of a finished answer (negative)
  "refund", // manual or automatic refund (positive)
  "adjustment", // admin correction, with a note
  "signup_gift", // welcome credits
] as const;
export type LedgerKind = (typeof LEDGER_KINDS)[number];

export const ledgerEntries = pgTable(
  "ledger_entries",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    kind: text("kind", { enum: LEDGER_KINDS }).notNull(),
    /** Signed: credits added are positive, spent or held are negative. */
    amountMcr: bigint("amount_mcr", { mode: "number" }).notNull(),
    /** What the entry is about, e.g. ("answer", id), ("payment", id). */
    refType: text("ref_type"),
    refId: text("ref_id"),
    /** Makes retried writes (webhooks, double clicks) a no-op. */
    idempotencyKey: text("idempotency_key").notNull(),
    note: text("note"),
    /** Admin user id for manual entries. */
    createdBy: text("created_by"),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex("ledger_idempotency_key").on(t.idempotencyKey),
    index("ledger_user_idx").on(t.userId, t.createdAt),
    index("ledger_ref_idx").on(t.refType, t.refId),
  ],
);

// ---- Payments (PayStation or sandbox)

export const payments = pgTable(
  "payments",
  {
    id: id(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    /** Our invoice number sent to the provider; unique, used for idempotency. */
    invoice: text("invoice").notNull(),
    provider: text("provider", { enum: ["paystation", "sandbox"] }).notNull(),
    method: text("method", { enum: ["bkash", "nagad", "card"] }).notNull(),
    kind: text("kind", { enum: ["topup", "pro"] }).notNull(),
    amountPaisa: integer("amount_paisa").notNull(),
    creditsMcr: bigint("credits_mcr", { mode: "number" }).notNull(),
    bonusMcr: bigint("bonus_mcr", { mode: "number" }).notNull().default(0),
    status: text("status", { enum: ["pending", "paid", "failed", "cancelled"] })
      .notNull()
      .default("pending"),
    providerTrxId: text("provider_trx_id"),
    failureReason: text("failure_reason"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("payments_invoice_key").on(t.invoice),
    index("payments_user_idx").on(t.userId, t.createdAt),
  ],
);

/** Every callback, webhook and status check we received, verbatim, for audits. */
export const paymentEvents = pgTable("payment_events", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  paymentId: text("payment_id").references(() => payments.id),
  source: text("source", {
    enum: ["callback", "webhook", "status-check", "sandbox"],
  }).notNull(),
  payload: jsonb("payload").notNull(),
  createdAt: createdAt(),
});

// ---- Images, presets, notifications

export const images = pgTable(
  "images",
  {
    id: id(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    chatId: text("chat_id").references(() => chats.id),
    prompt: text("prompt").notNull(),
    style: text("style", {
      enum: ["photo", "drawing", "logo", "poster"],
    }).notNull(),
    status: text("status", { enum: ["generating", "ready", "failed"] })
      .notNull()
      .default("generating"),
    /** PNG bytes, base64 (small demo images); a storage URL in production. */
    data: text("data"),
    mediaType: text("media_type"),
    costMcr: bigint("cost_mcr", { mode: "number" }).notNull().default(0),
    createdAt: createdAt(),
  },
  (t) => [index("images_user_idx").on(t.userId, t.createdAt)],
);

export const presets = pgTable("presets", {
  id: id(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  name: text("name").notNull(),
  models: jsonb("models").$type<ModelId[]>().notNull(),
  inUse: boolean("in_use").notNull().default(false),
  createdAt: createdAt(),
});

export const notificationPrefs = pgTable(
  "notification_prefs",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    type: text("type").notNull(),
    channel: text("channel").notNull(),
    enabled: boolean("enabled").notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.type, t.channel] })],
);

/** Admin actions (lookups that change something, manual refunds), for accountability. */
export const adminActions = pgTable("admin_actions", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  adminId: text("admin_id")
    .notNull()
    .references(() => users.id),
  action: text("action").notNull(),
  targetUserId: text("target_user_id"),
  reason: text("reason").notNull(),
  payload: jsonb("payload"),
  createdAt: createdAt(),
});
