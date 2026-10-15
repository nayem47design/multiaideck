import "server-only";

import { and, eq, gt, isNull } from "drizzle-orm";
import { cookies } from "next/headers";
import { createHash, randomBytes } from "node:crypto";

import { getDb } from "@/lib/db";
import { sessions, users } from "@/lib/db/schema";
import { ApiError } from "@/lib/server/api";
import { env } from "@/lib/server/env";

// Sessions: a random token in an httpOnly cookie; the database stores only its SHA-256.
// 30 days, extended on use. Signing out deletes the row.

export const SESSION_COOKIE = "mai_session";
const SESSION_DAYS = 30;

export type SessionUser = typeof users.$inferSelect;

const hash = (token: string) =>
  createHash("sha256").update(token).digest("hex");

export async function createSession(userId: string, userAgent?: string | null) {
  const db = await getDb();
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  await db.insert(sessions).values({
    id: hash(token),
    userId,
    userAgent: userAgent ?? null,
    expiresAt,
  });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

/** The signed-in user, or null. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const db = await getDb();
  const [row] = await db
    .select({ user: users })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(
      and(
        eq(sessions.id, hash(token)),
        gt(sessions.expiresAt, new Date()),
        isNull(users.deletedAt),
      ),
    );
  return row?.user ?? null;
}

/** The signed-in user, or a 401 ApiError. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new ApiError(401, "unauthorized", "Sign in first");
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "admin") throw new ApiError(403, "forbidden");
  return user;
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    const db = await getDb();
    await db.delete(sessions).where(eq(sessions.id, hash(token)));
  }
  jar.delete(SESSION_COOKIE);
}

/** Sign the user out everywhere (account deletion, security). */
export async function destroyAllSessions(userId: string) {
  const db = await getDb();
  await db.delete(sessions).where(eq(sessions.userId, userId));
}
