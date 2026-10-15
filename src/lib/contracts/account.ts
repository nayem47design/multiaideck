import { z } from "zod";

import { IsoDate, ModelIdSchema, UserSchema } from "./common";

// Account, settings, usage, presets, images, admin.
//
// PATCH  /api/me                      UpdateProfileRequest → MeResponse ({ user, balance, … })
// DELETE /api/me                      DeleteAccountRequest → 204   (signs out everywhere)
// GET    /api/me/export               → application/json download of the user's data
// POST   /api/me/password             SetPasswordRequest → 204  (409 conflict: email in use;
//                                      400 invalid_input: no email; 403 forbidden: wrong current)
// GET    /api/me/notifications        → NotificationPrefs
// PUT    /api/me/notifications        NotificationPrefs → NotificationPrefs
// GET    /api/usage?period=this-month|last-month → UsageResponse
// GET    /api/usage/export?period=    → text/csv
// GET    /api/presets                 → { presets: Preset[] }
// POST   /api/presets                 PresetInput → Preset
// PATCH  /api/presets/:id             PresetInput (partial) + { inUse } → Preset
// DELETE /api/presets/:id             → 204
// POST   /api/images                  CreateImageRequest → ImageSchema  (402 insufficient_credits)
// GET    /api/images                  → { images: Image[] }
// GET    /api/images/:id              → ImageSchema
// GET    /api/images/:id/file         → image/png
// GET    /api/admin/users?q=          → { users: AdminUser[] }      (admins only)
// GET    /api/admin/users/:id         → AdminUserDetail
// POST   /api/admin/users/:id/refund  AdminRefundRequest → AdminUserDetail

export const UpdateProfileRequest = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  /** What MultiAI calls the user in greetings; null clears it (first word of name). */
  preferredName: z.string().trim().min(1).max(40).nullable().optional(),
  locale: z.enum(["en", "bn"]).optional(),
  answerLanguage: z.string().max(20).optional(),
  lowBalanceAlert: z.number().int().min(0).max(1_000_000).optional(),
});

export const DeleteAccountRequest = z.object({ confirm: z.literal("DELETE") });

export const SetPasswordRequest = z.object({
  /** The sign-in email; defaults to the account's email. */
  email: z.string().trim().toLowerCase().email().optional(),
  /** 8+ characters with a number or symbol (Settings · Privacy rules). */
  password: z
    .string()
    .min(8)
    .max(200)
    .regex(/[\d\W_]/, "Add a number or symbol"),
  /** Required to change an existing password. */
  currentPassword: z.string().max(200).optional(),
});

export const NOTIFICATION_TYPES = [
  "lowBalance",
  "receipts",
  "weekly",
  "failed",
  "longAnswers",
  "models",
  "offers",
] as const;
export const NOTIFICATION_CHANNELS = ["app", "email"] as const;
/** Payment receipts are always on, on every channel. */
export const ALWAYS_ON_NOTIFICATIONS = ["receipts"] as const;

/** What a new account starts with (Figma: Settings · Notifications, M40). */
export const NOTIFICATION_DEFAULTS: Record<
  (typeof NOTIFICATION_TYPES)[number],
  Record<(typeof NOTIFICATION_CHANNELS)[number], boolean>
> = {
  lowBalance: { app: true, email: true },
  receipts: { app: true, email: true },
  weekly: { app: false, email: true },
  failed: { app: true, email: false },
  longAnswers: { app: true, email: false },
  models: { app: true, email: false },
  offers: { app: false, email: false },
};

export const NotificationPrefs = z.object({
  /**
   * type → channel → on. Types: NOTIFICATION_TYPES (receipts = payment receipts, always on);
   * channels: app, email. Unknown types or channels are rejected.
   */
  prefs: z.record(z.string(), z.record(z.string(), z.boolean())),
  /** Low-balance alert threshold in credits (same as PATCH /api/me lowBalanceAlert). */
  lowBalanceAlert: z.number().int().min(0).max(1_000_000).optional(),
});
export type NotificationPrefs = z.infer<typeof NotificationPrefs>;

export const UsagePeriod = z.enum(["this-month", "last-month"]);

export const UsageResponse = z.object({
  period: UsagePeriod,
  spent: z.object({ credits: z.number(), bdt: z.number() }),
  prompts: z.number(),
  chats: z.number(),
  averagePromptCredits: z.number().nullable(),
  byModel: z.array(
    z.object({
      model: ModelIdSchema,
      credits: z.number(),
      bdt: z.number(),
      share: z.number(),
    }),
  ),
  daily: z.array(z.object({ date: z.string(), credits: z.number() })),
  refundedCredits: z.number(),
  activity: z.array(
    z.object({
      chatId: z.string(),
      promptId: z.string(),
      date: IsoDate,
      chat: z.string(),
      /** Best answer, Compare, or a picture (Image studio). */
      mode: z.enum(["best", "compare", "image"]).optional(),
      models: z.array(ModelIdSchema),
      credits: z.number(),
      bdt: z.number(),
      breakdown: z.array(
        z.object({
          model: ModelIdSchema,
          credits: z.number(),
          bdt: z.number(),
          status: z.enum(["done", "failed", "stopped"]),
        }),
      ),
    }),
  ),
});
export type UsageResponse = z.infer<typeof UsageResponse>;

export const PresetSchema = z.object({
  id: z.string(),
  name: z.string(),
  models: z.array(ModelIdSchema),
  inUse: z.boolean(),
});
export type Preset = z.infer<typeof PresetSchema>;
export const PresetInput = z.object({
  name: z.string().trim().min(1).max(60),
  models: z.array(ModelIdSchema).min(1).max(6),
});

export const ImageStyle = z.enum(["photo", "drawing", "logo", "poster"]);
export const CreateImageRequest = z.object({
  prompt: z.string().trim().min(1).max(2000),
  style: ImageStyle,
});
export const ImageSchema = z.object({
  id: z.string(),
  prompt: z.string(),
  style: ImageStyle,
  status: z.enum(["generating", "ready", "failed"]),
  credits: z.number(),
  /** GET /api/images/:id/file when ready. */
  fileUrl: z.string().nullable(),
  createdAt: IsoDate,
  /** The picture's chat title (user content), e.g. "Golpo Coffee sign". */
  title: z.string().default(""),
  /** True for the generated stand-in (no image provider configured): screens draw it themselves. */
  placeholder: z.boolean().default(false),
});
export type Image = z.infer<typeof ImageSchema>;

export const AdminRefundRequest = z.object({
  credits: z.number().positive().max(10_000_000),
  reason: z.string().trim().min(5).max(500),
});
export const AdminUserSchema = UserSchema.extend({
  balanceCredits: z.number(),
});
export const AdminUserDetail = z.object({
  user: AdminUserSchema,
  ledger: z.array(
    z.object({
      id: z.number(),
      kind: z.string(),
      credits: z.number(),
      refType: z.string().nullable(),
      refId: z.string().nullable(),
      note: z.string().nullable(),
      createdBy: z.string().nullable(),
      createdAt: IsoDate,
    }),
  ),
  payments: z.array(z.unknown()),
});
