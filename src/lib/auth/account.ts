import "server-only";

import { and, asc, count, desc, eq, inArray, isNull } from "drizzle-orm";

import { balanceMcr } from "@/lib/billing/ledger";
import { credits } from "@/lib/billing/units";
import {
  ALWAYS_ON_NOTIFICATIONS,
  NOTIFICATION_CHANNELS,
  NOTIFICATION_DEFAULTS,
  NOTIFICATION_TYPES,
  type NotificationPrefs,
} from "@/lib/contracts/account";
import type { MeResponse } from "@/lib/contracts/auth";
import type { Db } from "@/lib/db";
import {
  answers,
  bestAnswers,
  chats,
  images,
  ledgerEntries,
  notificationPrefs,
  payments,
  presets,
  prompts,
  sessions,
  users,
} from "@/lib/db/schema";
import type { Locale } from "@/lib/i18n/config";
import { ApiError } from "@/lib/server/api";
import { toBalance, toUser } from "@/lib/server/users";

// Accounts: who is signing in, what /api/me returns, deleting and exporting an account,
// notification choices. Route handlers stay thin and call these.

export type UserRow = typeof users.$inferSelect;

const isUniqueViolation = (e: unknown) =>
  /unique|duplicate/i.test(
    String((e as { cause?: Error }).cause?.message ?? (e as Error)?.message),
  );

export async function meResponse(
  db: Db,
  user: UserRow,
  extra: { isNew?: boolean } = {},
): Promise<MeResponse> {
  const balance = await balanceMcr(db, user.id);
  return {
    user: toUser(user),
    balance: toBalance(balance),
    ...extra,
    topUpLeft: await topUpLeft(db, user.id, balance),
    chatCount: await chatCount(db, user.id),
  };
}

/** Balance as a share of the last top-up (credits + bonus), 0–100; null before any top-up. */
async function topUpLeft(db: Db, userId: string, balance: number) {
  const [last] = await db
    .select({ refId: ledgerEntries.refId, amount: ledgerEntries.amountMcr })
    .from(ledgerEntries)
    .where(
      and(eq(ledgerEntries.userId, userId), eq(ledgerEntries.kind, "topup")),
    )
    .orderBy(desc(ledgerEntries.id))
    .limit(1);
  if (!last) return null;
  let total = last.amount;
  if (last.refId) {
    const bonus = await db
      .select({ amount: ledgerEntries.amountMcr })
      .from(ledgerEntries)
      .where(
        and(
          eq(ledgerEntries.userId, userId),
          eq(ledgerEntries.kind, "bonus"),
          eq(ledgerEntries.refId, last.refId),
        ),
      );
    total += bonus.reduce((s, b) => s + b.amount, 0);
  }
  if (total <= 0) return null;
  return Math.max(0, Math.min(100, Math.round((balance / total) * 100)));
}

async function chatCount(db: Db, userId: string) {
  const [row] = await db
    .select({ n: count() })
    .from(chats)
    .where(and(eq(chats.userId, userId), isNull(chats.deletedAt)));
  return Number(row?.n ?? 0);
}

/** The live account with this phone (E.164), created on first sign-in. */
export async function findOrCreateByPhone(
  db: Db,
  phone: string,
  locale: Locale,
): Promise<{ user: UserRow; isNew: boolean }> {
  const find = async () =>
    (
      await db
        .select()
        .from(users)
        .where(and(eq(users.phone, phone), isNull(users.deletedAt)))
    )[0];
  const existing = await find();
  if (existing) return { user: existing, isNew: false };
  try {
    const [user] = await db.insert(users).values({ phone, locale }).returning();
    return { user, isNew: true };
  } catch (e) {
    // Two verifies at once: the other one created it.
    const raced = isUniqueViolation(e) ? await find() : undefined;
    if (raced) return { user: raced, isNew: false };
    throw e;
  }
}

export interface GoogleProfile {
  sub: string;
  email?: string;
  emailVerified: boolean;
  name?: string;
}

/**
 * Sign in with Google: link to `current` when someone is signed in; else the account with this
 * Google id; else the account whose *verified* email matches a verified Google email; else a new
 * account. Throws 409 conflict when the Google account already belongs to someone else.
 */
export async function googleAccount(
  db: Db,
  profile: GoogleProfile,
  current: UserRow | null,
  locale: Locale,
): Promise<{ user: UserRow; isNew: boolean }> {
  const live = (...where: Parameters<typeof and>) =>
    db
      .select()
      .from(users)
      .where(and(isNull(users.deletedAt), ...where))
      .limit(1);
  const [owner] = await live(eq(users.googleSub, profile.sub));
  const email =
    profile.emailVerified && profile.email
      ? profile.email.toLowerCase()
      : undefined;

  if (current) {
    if (owner && owner.id !== current.id)
      throw new ApiError(409, "conflict", "Google account in use");
    if (owner) return { user: owner, isNew: false };
    const emailFree =
      email && !current.email && !(await live(eq(users.email, email))).length;
    const [user] = await db
      .update(users)
      .set({
        googleSub: profile.sub,
        ...(emailFree ? { email, emailVerified: true } : {}),
        ...(!current.name && profile.name ? { name: profile.name } : {}),
        updatedAt: new Date(),
      })
      .where(eq(users.id, current.id))
      .returning();
    return { user, isNew: false };
  }

  if (owner) return { user: owner, isNew: false };

  if (email) {
    const [byEmail] = await live(
      eq(users.email, email),
      eq(users.emailVerified, true),
    );
    if (byEmail) {
      const [user] = await db
        .update(users)
        .set({ googleSub: profile.sub, updatedAt: new Date() })
        .where(eq(users.id, byEmail.id))
        .returning();
      return { user, isNew: false };
    }
  }

  const emailTaken = email && (await live(eq(users.email, email))).length;
  const [user] = await db
    .insert(users)
    .values({
      googleSub: profile.sub,
      name: profile.name ?? "",
      locale,
      ...(email && !emailTaken ? { email, emailVerified: true } : {}),
    })
    .returning();
  return { user, isNew: true };
}

/**
 * Soft-delete: the row stays (the ledger and payments point at it and are never touched), but it
 * no longer signs in and its phone, email, Google id and password are cleared so they can sign
 * up again. Every session ends.
 */
export async function softDeleteUser(db: Db, userId: string) {
  await db
    .update(users)
    .set({
      deletedAt: new Date(),
      updatedAt: new Date(),
      phone: null,
      email: null,
      emailVerified: false,
      googleSub: null,
      passwordHash: null,
    })
    .where(eq(users.id, userId));
  await db.delete(sessions).where(eq(sessions.userId, userId));
}

/** Everything we hold about the user, for "Download your data". */
export async function exportUserData(db: Db, user: UserRow) {
  const chatRows = await db
    .select()
    .from(chats)
    .where(and(eq(chats.userId, user.id), isNull(chats.deletedAt)))
    .orderBy(asc(chats.createdAt));
  const chatIds = chatRows.map((c) => c.id);
  const promptRows = chatIds.length
    ? await db
        .select()
        .from(prompts)
        .where(inArray(prompts.chatId, chatIds))
        .orderBy(asc(prompts.seq))
    : [];
  const promptIds = promptRows.map((p) => p.id);
  const answerRows = chatIds.length
    ? await db
        .select()
        .from(answers)
        .where(inArray(answers.chatId, chatIds))
        .orderBy(asc(answers.createdAt))
    : [];
  const bestRows = promptIds.length
    ? await db
        .select()
        .from(bestAnswers)
        .where(inArray(bestAnswers.promptId, promptIds))
    : [];

  const paymentRows = await db
    .select()
    .from(payments)
    .where(eq(payments.userId, user.id))
    .orderBy(asc(payments.createdAt));
  const ledgerRows = await db
    .select()
    .from(ledgerEntries)
    .where(eq(ledgerEntries.userId, user.id))
    .orderBy(asc(ledgerEntries.id));
  const presetRows = await db
    .select()
    .from(presets)
    .where(eq(presets.userId, user.id));
  const imageRows = await db
    .select({
      id: images.id,
      prompt: images.prompt,
      style: images.style,
      status: images.status,
      costMcr: images.costMcr,
      createdAt: images.createdAt,
    })
    .from(images)
    .where(eq(images.userId, user.id));

  return {
    exportedAt: new Date().toISOString(),
    profile: { ...toUser(user), lowBalanceAlert: user.lowBalanceAlert },
    notifications: await getNotificationPrefs(db, user),
    chats: chatRows.map((c) => ({
      id: c.id,
      title: c.title,
      kind: c.kind,
      pinned: c.pinned,
      createdAt: c.createdAt.toISOString(),
      prompts: promptRows
        .filter((p) => p.chatId === c.id)
        .map((p) => ({
          seq: p.seq,
          text: p.text,
          mode: p.mode,
          models: p.models,
          attachments: p.attachments,
          createdAt: p.createdAt.toISOString(),
          answers: answerRows
            .filter((a) => a.promptId === p.id)
            .map((a) => ({
              model: a.model,
              modelVersion: a.modelVersion,
              status: a.status,
              failure: a.failure,
              text: a.text,
              credits: credits(a.costMcr + a.catchUpCostMcr),
              createdAt: a.createdAt.toISOString(),
            })),
          best:
            bestRows
              .filter((b) => b.promptId === p.id)
              .map((b) => ({
                status: b.status,
                intro: b.intro,
                points: b.points,
                credits: credits(b.costMcr),
              }))[0] ?? null,
        })),
    })),
    payments: paymentRows.map((p) => ({
      invoice: p.invoice,
      kind: p.kind,
      method: p.method,
      provider: p.provider,
      bdt: p.amountPaisa / 100,
      credits: credits(p.creditsMcr),
      bonusCredits: credits(p.bonusMcr),
      status: p.status,
      providerTrxId: p.providerTrxId,
      createdAt: p.createdAt.toISOString(),
    })),
    ledger: ledgerRows.map((e) => ({
      id: e.id,
      kind: e.kind,
      credits: credits(e.amountMcr),
      refType: e.refType,
      refId: e.refId,
      note: e.note,
      createdAt: e.createdAt.toISOString(),
    })),
    presets: presetRows.map((p) => ({
      name: p.name,
      models: p.models,
      inUse: p.inUse,
    })),
    images: imageRows.map((i) => ({
      ...i,
      credits: credits(i.costMcr),
      costMcr: undefined,
      createdAt: i.createdAt.toISOString(),
    })),
  };
}

// ---- Notifications

export async function getNotificationPrefs(
  db: Db,
  user: UserRow,
): Promise<NotificationPrefs> {
  const rows = await db
    .select()
    .from(notificationPrefs)
    .where(eq(notificationPrefs.userId, user.id));
  const prefs: Record<string, Record<string, boolean>> = structuredClone(
    NOTIFICATION_DEFAULTS,
  );
  for (const r of rows)
    if (prefs[r.type] && r.channel in prefs[r.type])
      prefs[r.type][r.channel] = r.enabled;
  for (const type of ALWAYS_ON_NOTIFICATIONS)
    for (const channel of NOTIFICATION_CHANNELS) prefs[type][channel] = true;
  return { prefs, lowBalanceAlert: user.lowBalanceAlert };
}

export async function setNotificationPrefs(
  db: Db,
  user: UserRow,
  input: NotificationPrefs,
): Promise<NotificationPrefs> {
  const rows: { type: string; channel: string; enabled: boolean }[] = [];
  for (const [type, channels] of Object.entries(input.prefs)) {
    if (!(NOTIFICATION_TYPES as readonly string[]).includes(type))
      throw new ApiError(400, "invalid_input", `Unknown type ${type}`);
    for (const [channel, enabled] of Object.entries(channels)) {
      if (!(NOTIFICATION_CHANNELS as readonly string[]).includes(channel))
        throw new ApiError(400, "invalid_input", `Unknown channel ${channel}`);
      // Payment receipts can't be turned off.
      if ((ALWAYS_ON_NOTIFICATIONS as readonly string[]).includes(type))
        continue;
      rows.push({ type, channel, enabled });
    }
  }
  for (const r of rows)
    await db
      .insert(notificationPrefs)
      .values({ userId: user.id, ...r })
      .onConflictDoUpdate({
        target: [
          notificationPrefs.userId,
          notificationPrefs.type,
          notificationPrefs.channel,
        ],
        set: { enabled: r.enabled },
      });
  let current = user;
  if (input.lowBalanceAlert !== undefined)
    [current] = await db
      .update(users)
      .set({ lowBalanceAlert: input.lowBalanceAlert, updatedAt: new Date() })
      .where(eq(users.id, user.id))
      .returning();
  return getNotificationPrefs(db, current);
}
