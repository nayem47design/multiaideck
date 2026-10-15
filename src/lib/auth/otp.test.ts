// @vitest-environment node
import { beforeAll, describe, expect, it } from "vitest";

import type { Db } from "@/lib/db";
import { otpCodes } from "@/lib/db/schema";
import { useTestDb } from "@/lib/db/testing";
import { ApiError } from "@/lib/server/api";

import { checkCode, hashCode, issueCode, OTP } from "./otp";

let db: Db;
beforeAll(async () => {
  db = await useTestDb();
});

const T0 = new Date("2026-10-16T10:00:00Z");
const at = (seconds: number) => new Date(T0.getTime() + seconds * 1000);
let n = 0;
/** A fresh number and IP per test, so limits don't leak between tests. */
const fresh = () => {
  n += 1;
  return {
    phone: `+88017000000${String(n).padStart(2, "0")}`,
    ip: `10.0.0.${n}`,
  };
};

async function apiError(p: Promise<unknown>) {
  try {
    await p;
  } catch (e) {
    if (e instanceof ApiError) return e;
    throw e;
  }
  throw new Error("expected an ApiError");
}

const wrong = (code: string) =>
  String((Number(code) + 1) % 1_000_000).padStart(6, "0");

describe("issueCode", () => {
  it("makes a 6-digit code and stores only its HMAC", async () => {
    const { phone, ip } = fresh();
    const sent = await issueCode(db, { phone, ip, now: T0 });
    expect(sent.code).toMatch(/^\d{6}$/);
    expect(sent).toMatchObject({ resendIn: 60, expiresIn: 300 });
    const rows = await db.select().from(otpCodes);
    const row = rows.find((r) => r.phone === phone)!;
    expect(row.codeHash).toBe(hashCode(phone, sent.code));
    expect(row.codeHash).not.toContain(sent.code);
  });

  it("waits 60 s before another code", async () => {
    const { phone, ip } = fresh();
    await issueCode(db, { phone, ip, now: T0 });
    const e = await apiError(issueCode(db, { phone, ip, now: at(20) }));
    expect(e.status).toBe(429);
    expect(e.code).toBe("rate_limited");
    expect(e.details).toMatchObject({ retryAfter: 40, limit: "resend" });
    await expect(
      issueCode(db, { phone, ip, now: at(60) }),
    ).resolves.toBeTruthy();
  });

  it("allows 5 codes per phone per hour", async () => {
    const { phone, ip } = fresh();
    for (let i = 0; i < OTP.perPhonePerHour; i++)
      await issueCode(db, { phone, ip, now: at(i * 61) });
    const e = await apiError(issueCode(db, { phone, ip, now: at(5 * 61) }));
    expect(e.status).toBe(429);
    expect(e.details?.limit).toBe("phone");
    // The first code leaves the window an hour after it was sent.
    expect(e.details?.retryAfter).toBe(3600 - 5 * 61);
    await expect(
      issueCode(db, { phone, ip, now: at(3601) }),
    ).resolves.toBeTruthy();
  });

  it("allows 20 codes per IP per hour", async () => {
    const { ip } = fresh();
    for (let i = 0; i < OTP.perIpPerHour; i++)
      await issueCode(db, {
        phone: `+8801900000${String(i).padStart(3, "0")}`,
        ip,
        now: T0,
      });
    const e = await apiError(
      issueCode(db, { phone: "+8801999999999", ip, now: at(1) }),
    );
    expect(e.status).toBe(429);
    expect(e.details?.limit).toBe("ip");
  });
});

describe("checkCode", () => {
  it("accepts the right code once", async () => {
    const { phone, ip } = fresh();
    const { code } = await issueCode(db, { phone, ip, now: T0 });
    await expect(
      checkCode(db, { phone, code, now: at(30) }),
    ).resolves.toBeUndefined();
    const again = await apiError(checkCode(db, { phone, code, now: at(31) }));
    expect(again.code).toBe("code_expired");
  });

  it("rejects an expired code", async () => {
    const { phone, ip } = fresh();
    const { code } = await issueCode(db, { phone, ip, now: T0 });
    const e = await apiError(
      checkCode(db, { phone, code, now: at(OTP.ttlSec) }),
    );
    expect(e.status).toBe(400);
    expect(e.code).toBe("code_expired");
  });

  it("only the newest code counts", async () => {
    const { phone, ip } = fresh();
    const first = await issueCode(db, { phone, ip, now: T0 });
    const second = await issueCode(db, { phone, ip, now: at(61) });
    if (first.code !== second.code) {
      const e = await apiError(
        checkCode(db, { phone, code: first.code, now: at(62) }),
      );
      expect(e.code).toBe("code_invalid");
    }
    await expect(
      checkCode(db, { phone, code: second.code, now: at(63) }),
    ).resolves.toBeUndefined();
  });

  it("counts wrong tries and kills the code after 5", async () => {
    const { phone, ip } = fresh();
    const { code } = await issueCode(db, { phone, ip, now: T0 });
    for (let i = 1; i <= OTP.triesPerCode; i++) {
      const e = await apiError(
        checkCode(db, { phone, code: wrong(code), now: at(i) }),
      );
      expect(e.code).toBe("code_invalid");
      expect(e.details?.attemptsLeft).toBe(OTP.triesPerCode - i);
    }
    // Even the right code is dead now.
    const e = await apiError(checkCode(db, { phone, code, now: at(10) }));
    expect(e.code).toBe("code_expired");
  });

  it("locks the phone for 30 minutes after 10 wrong tries in an hour", async () => {
    const { phone, ip } = fresh();
    let t = 0;
    let e: ApiError | undefined;
    for (let round = 0; round < 2; round++) {
      const { code } = await issueCode(db, { phone, ip, now: at(t) });
      for (let i = 0; i < OTP.triesPerCode; i++) {
        t += 1;
        e = await apiError(
          checkCode(db, { phone, code: wrong(code), now: at(t) }),
        );
      }
      t += 61;
    }
    expect(e!.status).toBe(423);
    expect(e!.code).toBe("locked");
    expect(e!.details?.retryAfter).toBe(OTP.lockSec);

    // Locked: no new codes and no checks…
    const send = await apiError(issueCode(db, { phone, ip, now: at(t) }));
    expect(send.status).toBe(423);
    expect(Number(send.details?.retryAfter)).toBeGreaterThan(0);

    // …until the 30 minutes are over; then the count starts again.
    const after = t + OTP.lockSec;
    const { code } = await issueCode(db, {
      phone,
      ip: "10.9.9.9",
      now: at(after),
    });
    const one = await apiError(
      checkCode(db, { phone, code: wrong(code), now: at(after + 1) }),
    );
    expect(one.code).toBe("code_invalid");
    await expect(
      checkCode(db, { phone, code, now: at(after + 2) }),
    ).resolves.toBeUndefined();
  });

  it("says expired when no code was sent", async () => {
    const { phone } = fresh();
    const e = await apiError(checkCode(db, { phone, code: "123456", now: T0 }));
    expect(e.code).toBe("code_expired");
  });
});
