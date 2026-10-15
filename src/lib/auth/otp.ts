import "server-only";

import { and, desc, eq, gt, isNull, ne, sql } from "drizzle-orm";
import { createHmac, randomInt, timingSafeEqual } from "node:crypto";

import type { Db } from "@/lib/db";
import { otpCodes } from "@/lib/db/schema";
import { ApiError } from "@/lib/server/api";
import { authSecret } from "@/lib/server/env";

// SMS sign-in codes. Only an HMAC of each code is stored (keyed with AUTH_SECRET and bound to the
// phone), so a database leak doesn't reveal live codes. All limits are counted from otp_codes:
//
//   - a code is 6 digits, lives 5 minutes, and only the newest code for a phone counts
//   - 60 s before another code can be sent to the same phone
//   - at most 5 codes per phone and 20 per IP in any hour (429 rate_limited, details.retryAfter)
//   - 5 wrong tries kill a code (then 400 code_expired: ask for a new one)
//   - 10 wrong tries for a phone within an hour lock it for 30 minutes (423 locked)
//
// A lock is stored as a marker row in otp_codes (code_hash = LOCK_MARKER, which no HMAC equals,
// expires_at = end of the lock, already consumed so it can never verify).

export const OTP = {
  length: 6,
  ttlSec: 5 * 60,
  resendSec: 60,
  perPhonePerHour: 5,
  perIpPerHour: 20,
  triesPerCode: 5,
  lockAfterWrong: 10,
  lockSec: 30 * 60,
} as const;

const HOUR = 3_600_000;
const LOCK_MARKER = "!lock";

const secondsUntil = (t: Date, now: Date) =>
  Math.max(1, Math.ceil((t.getTime() - now.getTime()) / 1000));

export function hashCode(phone: string, code: string) {
  return createHmac("sha256", authSecret())
    .update(`otp:${phone}:${code}`)
    .digest("hex");
}

function sameHash(a: string, b: string) {
  const x = Buffer.from(a, "hex");
  const y = Buffer.from(b, "hex");
  return x.length === y.length && timingSafeEqual(x, y);
}

/** "1712345214" → "+8801712345214". Expects BdPhoneSchema's normalized national number. */
export const toE164 = (national: string) => `+880${national}`;

/** End of the current lock for this phone, if any. */
async function lockedUntil(db: Db, phone: string, now: Date) {
  const [lock] = await db
    .select({ until: otpCodes.expiresAt })
    .from(otpCodes)
    .where(
      and(
        eq(otpCodes.phone, phone),
        eq(otpCodes.codeHash, LOCK_MARKER),
        gt(otpCodes.expiresAt, now),
      ),
    )
    .orderBy(desc(otpCodes.expiresAt))
    .limit(1);
  return lock?.until ?? null;
}

async function assertNotLocked(db: Db, phone: string, now: Date) {
  const until = await lockedUntil(db, phone, now);
  if (until)
    throw new ApiError(423, "locked", "Too many wrong codes. Try later.", {
      retryAfter: secondsUntil(until, now),
    });
}

/**
 * Create a code for `phone` (E.164) and return it, to be sent by SMS. Throws 423 when the phone is
 * locked and 429 when a limit is hit.
 */
export async function issueCode(
  db: Db,
  { phone, ip, now = new Date() }: { phone: string; ip: string; now?: Date },
) {
  await assertNotLocked(db, phone, now);
  const hourAgo = new Date(now.getTime() - HOUR);

  const recent = await db
    .select({ createdAt: otpCodes.createdAt })
    .from(otpCodes)
    .where(
      and(
        eq(otpCodes.phone, phone),
        ne(otpCodes.codeHash, LOCK_MARKER),
        gt(otpCodes.createdAt, hourAgo),
      ),
    )
    .orderBy(desc(otpCodes.createdAt));

  const last = recent[0]?.createdAt;
  if (last && now.getTime() - last.getTime() < OTP.resendSec * 1000)
    throw new ApiError(429, "rate_limited", "Wait before asking again", {
      retryAfter: secondsUntil(
        new Date(last.getTime() + OTP.resendSec * 1000),
        now,
      ),
      limit: "resend",
    });
  if (recent.length >= OTP.perPhonePerHour)
    throw new ApiError(429, "rate_limited", "Too many codes for this number", {
      retryAfter: secondsUntil(
        new Date(recent[OTP.perPhonePerHour - 1].createdAt.getTime() + HOUR),
        now,
      ),
      limit: "phone",
    });

  const fromIp = await db
    .select({ createdAt: otpCodes.createdAt })
    .from(otpCodes)
    .where(
      and(
        eq(otpCodes.ip, ip),
        ne(otpCodes.codeHash, LOCK_MARKER),
        gt(otpCodes.createdAt, hourAgo),
      ),
    )
    .orderBy(desc(otpCodes.createdAt));
  if (fromIp.length >= OTP.perIpPerHour)
    throw new ApiError(429, "rate_limited", "Too many codes from here", {
      retryAfter: secondsUntil(
        new Date(fromIp[OTP.perIpPerHour - 1].createdAt.getTime() + HOUR),
        now,
      ),
      limit: "ip",
    });

  const code = String(randomInt(0, 10 ** OTP.length)).padStart(OTP.length, "0");
  await db.insert(otpCodes).values({
    phone,
    ip,
    codeHash: hashCode(phone, code),
    createdAt: now,
    expiresAt: new Date(now.getTime() + OTP.ttlSec * 1000),
  });
  return { code, resendIn: OTP.resendSec, expiresIn: OTP.ttlSec };
}

/**
 * Check a code for `phone` (E.164). Resolves when it is right (the code is used up); otherwise
 * throws 400 code_invalid (details.attemptsLeft), 400 code_expired or 423 locked.
 */
export async function checkCode(
  db: Db,
  {
    phone,
    code,
    now = new Date(),
  }: { phone: string; code: string; now?: Date },
) {
  await assertNotLocked(db, phone, now);

  const [row] = await db
    .select()
    .from(otpCodes)
    .where(and(eq(otpCodes.phone, phone), ne(otpCodes.codeHash, LOCK_MARKER)))
    .orderBy(desc(otpCodes.createdAt))
    .limit(1);

  const expired = (r: typeof row) =>
    !r ||
    r.consumedAt !== null ||
    r.expiresAt <= now ||
    r.attempts >= OTP.triesPerCode;
  if (expired(row))
    throw new ApiError(400, "code_expired", "Ask for a new code");

  // Hash the guess either way, then compare in constant time.
  if (sameHash(hashCode(phone, code), row.codeHash)) {
    const used = await db
      .update(otpCodes)
      .set({ consumedAt: now })
      .where(and(eq(otpCodes.id, row.id), isNull(otpCodes.consumedAt)))
      .returning({ id: otpCodes.id });
    if (!used.length)
      throw new ApiError(400, "code_expired", "Ask for a new code");
    return;
  }

  const [counted] = await db
    .update(otpCodes)
    .set({ attempts: sql`${otpCodes.attempts} + 1` })
    .where(eq(otpCodes.id, row.id))
    .returning({ attempts: otpCodes.attempts });

  if ((await wrongTries(db, phone, now)) >= OTP.lockAfterWrong) {
    const until = new Date(now.getTime() + OTP.lockSec * 1000);
    await db.insert(otpCodes).values({
      phone,
      codeHash: LOCK_MARKER,
      createdAt: now,
      expiresAt: until,
      consumedAt: now,
    });
    throw new ApiError(423, "locked", "Too many wrong codes. Try later.", {
      retryAfter: OTP.lockSec,
    });
  }
  throw new ApiError(400, "code_invalid", "That code isn’t right", {
    attemptsLeft: Math.max(0, OTP.triesPerCode - counted.attempts),
  });
}

/** Wrong tries for this phone in the last hour, not counting those before the last lock. */
async function wrongTries(db: Db, phone: string, now: Date) {
  const [lastLock] = await db
    .select({ createdAt: otpCodes.createdAt })
    .from(otpCodes)
    .where(and(eq(otpCodes.phone, phone), eq(otpCodes.codeHash, LOCK_MARKER)))
    .orderBy(desc(otpCodes.createdAt))
    .limit(1);
  const hourAgo = new Date(now.getTime() - HOUR);
  const since =
    lastLock && lastLock.createdAt > hourAgo ? lastLock.createdAt : hourAgo;
  const [{ total }] = await db
    .select({ total: sql<number>`coalesce(sum(${otpCodes.attempts}), 0)::int` })
    .from(otpCodes)
    .where(
      and(
        eq(otpCodes.phone, phone),
        ne(otpCodes.codeHash, LOCK_MARKER),
        gt(otpCodes.createdAt, since),
      ),
    );
  return Number(total);
}
