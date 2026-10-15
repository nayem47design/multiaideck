import { z } from "zod";

import { IsoDate, ModelIdSchema } from "./common";

// Asking and comparing.
//
// POST  /api/estimate                    EstimateRequest → EstimateResponse
// GET   /api/chats?q=&kind=              → ChatListResponse
// POST  /api/chats                       SendPromptRequest → SendPromptResponse  (402 insufficient_credits)
// GET   /api/chats/:id                   → ChatDetail
// PATCH /api/chats/:id                   UpdateChatRequest → ChatSummary
// DELETE /api/chats/:id                  → 204
// POST  /api/chats/:id/prompts           SendPromptRequest (+recipients) → SendPromptResponse
// GET   /api/prompts/:id/stream          → text/event-stream of StreamEvent (resumable: replays)
// POST  /api/prompts/:id/stop            → 204 (unfinished answers stop; they cost nothing)
// POST  /api/answers/:id/retry           → SendPromptResponse (a new answer for the same prompt)
// POST  /api/answers/:id/swap            SwapModelRequest → SendPromptResponse
//
// Each answer is independent: a model receives only the user's prompts and its own earlier
// answers in the chat, never another model's (AGENTS.md rule 7). A model that missed earlier
// prompts first reads them ("catching up"); that cost is reported separately.

export const ModeSchema = z.enum(["best", "compare"]);
export type Mode = z.infer<typeof ModeSchema>;

export const AttachmentSchema = z.object({
  name: z.string().max(200),
  kind: z.enum(["file", "image"]),
  size: z.number().int().nonnegative(),
});

export const SendPromptRequest = z.object({
  text: z.string().trim().min(1).max(20_000),
  mode: ModeSchema,
  /** 1–6 models. */
  models: z.array(ModelIdSchema).min(1).max(6),
  attachments: z.array(AttachmentSchema).max(10).default([]),
  /**
   * Follow-ups only: which models get this prompt. Defaults to `models`. Models that missed
   * earlier prompts catch up first.
   */
  recipients: z.array(ModelIdSchema).min(1).max(6).optional(),
});
export type SendPromptRequest = z.input<typeof SendPromptRequest>;

export const SendPromptResponse = z.object({
  chatId: z.string(),
  promptId: z.string(),
  /** Credits held until the answers finish. */
  reservedCredits: z.number(),
});
export type SendPromptResponse = z.infer<typeof SendPromptResponse>;

export const EstimateRequest = z.object({
  text: z.string().max(20_000).default(""),
  mode: ModeSchema,
  models: z.array(ModelIdSchema).min(1).max(6),
  chatId: z.string().optional(),
});
export const EstimateResponse = z.object({
  /** e.g. 2 and 4 → "≈ 2 to 4 cr". */
  minCredits: z.number(),
  maxCredits: z.number(),
  /** Catch-up cost for models that missed earlier prompts, per model. */
  catchUp: z
    .array(z.object({ model: ModelIdSchema, credits: z.number() }))
    .default([]),
});
export type EstimateResponse = z.infer<typeof EstimateResponse>;

export const AnswerStatus = z.enum([
  "queued",
  "catching-up",
  "streaming",
  "done",
  "failed",
  "stopped",
]);
export const FailureReason = z.enum([
  "timeout",
  "unavailable",
  "error",
  "stopped",
]);

export const AnswerSchema = z.object({
  id: z.string(),
  promptId: z.string(),
  model: ModelIdSchema,
  modelVersion: z.string(),
  status: AnswerStatus,
  failure: FailureReason.nullable(),
  text: z.string(),
  durationMs: z.number().nullable(),
  tokens: z.number(),
  credits: z.number(),
  catchUpCredits: z.number(),
  retryOf: z.string().nullable(),
});
export type Answer = z.infer<typeof AnswerSchema>;

export const BestAnswerSchema = z.object({
  status: z.enum(["streaming", "done", "failed"]),
  intro: z.string(),
  points: z.array(
    z.object({ lead: z.string(), text: z.string(), model: ModelIdSchema }),
  ),
  credits: z.number(),
  durationMs: z.number().nullable(),
});
export type BestAnswer = z.infer<typeof BestAnswerSchema>;

export const PromptSchema = z.object({
  id: z.string(),
  seq: z.number(),
  text: z.string(),
  mode: ModeSchema,
  models: z.array(ModelIdSchema),
  attachments: z.array(AttachmentSchema),
  status: z.enum(["running", "done", "stopped"]),
  createdAt: IsoDate,
  answers: z.array(AnswerSchema),
  best: BestAnswerSchema.nullable(),
});
export type Prompt = z.infer<typeof PromptSchema>;

export const ChatSummarySchema = z.object({
  id: z.string(),
  title: z.string(),
  kind: z.enum(["best", "compare", "image"]),
  models: z.array(ModelIdSchema),
  prompts: z.number(),
  credits: z.number(),
  pinned: z.boolean(),
  /** First prompt, for search. */
  snippet: z.string(),
  updatedAt: IsoDate,
});
export type ChatSummary = z.infer<typeof ChatSummarySchema>;

export const ChatListResponse = z.object({ chats: z.array(ChatSummarySchema) });
export type ChatListResponse = z.infer<typeof ChatListResponse>;

export const ChatDetailSchema = ChatSummarySchema.extend({
  promptsList: z.array(PromptSchema),
});
export type ChatDetail = z.infer<typeof ChatDetailSchema>;

export const UpdateChatRequest = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  pinned: z.boolean().optional(),
});

export const SwapModelRequest = z.object({ model: ModelIdSchema });

/** Server-sent events on /api/prompts/:id/stream, one JSON object per `data:` line. */
export const StreamEvent = z.discriminatedUnion("type", [
  z.object({ type: z.literal("snapshot"), prompt: PromptSchema }),
  z.object({
    type: z.literal("answer-status"),
    answerId: z.string(),
    status: AnswerStatus,
    failure: FailureReason.nullable().optional(),
  }),
  z.object({
    type: z.literal("answer-delta"),
    answerId: z.string(),
    delta: z.string(),
  }),
  z.object({ type: z.literal("answer-done"), answer: AnswerSchema }),
  z.object({ type: z.literal("best-delta"), best: BestAnswerSchema }),
  z.object({ type: z.literal("best-done"), best: BestAnswerSchema }),
  z.object({ type: z.literal("done"), balance: z.number() }),
]);
export type StreamEvent = z.infer<typeof StreamEvent>;
