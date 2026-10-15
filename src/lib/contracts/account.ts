import { z } from "zod";

import { IsoDate, ModelIdSchema, UserSchema } from "./common";

// Account, settings, usage, presets, images, admin.
//
// PATCH  /api/me                      UpdateProfileRequest → { user }
// DELETE /api/me                      DeleteAccountRequest → 204   (signs out everywhere)
// GET    /api/me/export               → application/json download of the user's data
// POST   /api/me/password             SetPasswordRequest → 204
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
  locale: z.enum(["en", "bn"]).optional(),
  answerLanguage: z.string().max(20).optional(),
  lowBalanceAlert: z.number().int().min(0).max(1_000_000).optional(),
});

export const DeleteAccountRequest = z.object({ confirm: z.literal("DELETE") });

export const SetPasswordRequest = z.object({
  email: z.string().email().optional(),
  password: z.string().min(10).max(200),
});

export const NotificationPrefs = z.object({
  /** type → channel → on. Types: payment-receipt (always on), low-balance, answer-ready, product. */
  prefs: z.record(z.string(), z.record(z.string(), z.boolean())),
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
