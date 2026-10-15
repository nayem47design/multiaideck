// @vitest-environment node
import { eq } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";

import { appendEntry } from "@/lib/billing/ledger";
import type { Db } from "@/lib/db";
import { ledgerEntries, sessions, users } from "@/lib/db/schema";
import { useTestDb } from "@/lib/db/testing";

import {
  findOrCreateByPhone,
  getNotificationPrefs,
  googleAccount,
  meResponse,
  setNotificationPrefs,
  softDeleteUser,
} from "./account";

let db: Db;
beforeAll(async () => {
  db = await useTestDb();
});

describe("accounts", () => {
  it("creates a phone user on first sign-in only", async () => {
    const first = await findOrCreateByPhone(db, "+8801711111111", "bn");
    expect(first.isNew).toBe(true);
    expect(first.user.locale).toBe("bn");
    const again = await findOrCreateByPhone(db, "+8801711111111", "en");
    expect(again).toMatchObject({ isNew: false, user: { id: first.user.id } });
  });

  it("deleting frees the phone, ends sessions and keeps the ledger", async () => {
    const { user } = await findOrCreateByPhone(db, "+8801722222222", "en");
    await appendEntry(db, {
      userId: user.id,
      kind: "signup_gift",
      amountMcr: 5000,
      idempotencyKey: `test:gift:${user.id}`,
    });
    await db.insert(sessions).values({
      id: `s-${user.id}`,
      userId: user.id,
      expiresAt: new Date(Date.now() + 86_400_000),
    });

    await softDeleteUser(db, user.id);

    const [row] = await db.select().from(users).where(eq(users.id, user.id));
    expect(row.deletedAt).not.toBeNull();
    expect(row).toMatchObject({ phone: null, email: null, googleSub: null });
    expect(
      await db.select().from(sessions).where(eq(sessions.userId, user.id)),
    ).toHaveLength(0);
    expect(
      await db
        .select()
        .from(ledgerEntries)
        .where(eq(ledgerEntries.userId, user.id)),
    ).toHaveLength(1);

    const back = await findOrCreateByPhone(db, "+8801722222222", "en");
    expect(back.isNew).toBe(true);
    expect(back.user.id).not.toBe(user.id);
  });

  it("Google: signs in, links, and refuses someone else's account", async () => {
    const created = await googleAccount(
      db,
      {
        sub: "g-1",
        email: "Rina@Example.com",
        emailVerified: true,
        name: "Rina",
      },
      null,
      "en",
    );
    expect(created.isNew).toBe(true);
    expect(created.user).toMatchObject({
      email: "rina@example.com",
      emailVerified: true,
      name: "Rina",
    });
    const again = await googleAccount(
      db,
      { sub: "g-1", emailVerified: false },
      null,
      "en",
    );
    expect(again).toMatchObject({
      isNew: false,
      user: { id: created.user.id },
    });

    const { user: phoneUser } = await findOrCreateByPhone(
      db,
      "+8801733333333",
      "en",
    );
    const linked = await googleAccount(
      db,
      { sub: "g-2", email: "kamal@example.com", emailVerified: true },
      phoneUser,
      "en",
    );
    expect(linked.user).toMatchObject({ id: phoneUser.id, googleSub: "g-2" });

    await expect(
      googleAccount(db, { sub: "g-1", emailVerified: false }, phoneUser, "en"),
    ).rejects.toMatchObject({ code: "conflict" });
  });

  it("an unverified Google email never takes over an account", async () => {
    const owner = await googleAccount(
      db,
      { sub: "g-3", email: "owner@example.com", emailVerified: true },
      null,
      "en",
    );
    const other = await googleAccount(
      db,
      { sub: "g-4", email: "owner@example.com", emailVerified: false },
      null,
      "en",
    );
    expect(other.user.id).not.toBe(owner.user.id);
    expect(other.user.email).toBeNull();
  });

  it("notification choices: defaults, saving, receipts always on", async () => {
    const { user } = await findOrCreateByPhone(db, "+8801744444444", "en");
    const defaults = await getNotificationPrefs(db, user);
    expect(defaults.prefs.offers).toEqual({ app: false, email: false });
    expect(defaults.lowBalanceAlert).toBe(500);

    const saved = await setNotificationPrefs(db, user, {
      prefs: { offers: { app: true }, receipts: { email: false } },
      lowBalanceAlert: 800,
    });
    expect(saved.prefs.offers).toEqual({ app: true, email: false });
    expect(saved.prefs.receipts).toEqual({ app: true, email: true });
    expect(saved.lowBalanceAlert).toBe(800);

    await expect(
      setNotificationPrefs(db, user, { prefs: { nope: { app: true } } }),
    ).rejects.toMatchObject({ code: "invalid_input" });
  });

  it("/api/me shape: balance and share of the last top-up", async () => {
    const { user } = await findOrCreateByPhone(db, "+8801755555555", "en");
    expect((await meResponse(db, user)).topUpLeft).toBeNull();
    await appendEntry(db, {
      userId: user.id,
      kind: "topup",
      amountMcr: 8_000_000,
      refType: "payment",
      refId: "p1",
      idempotencyKey: "test:topup:p1",
    });
    await appendEntry(db, {
      userId: user.id,
      kind: "bonus",
      amountMcr: 2_000_000,
      refType: "payment",
      refId: "p1",
      idempotencyKey: "test:bonus:p1",
    });
    await appendEntry(db, {
      userId: user.id,
      kind: "adjustment",
      amountMcr: -4_000_000,
      idempotencyKey: "test:adj:p1",
    });
    const me = await meResponse(db, user);
    expect(me.balance).toEqual({ credits: 6000, bdt: 60 });
    expect(me.topUpLeft).toBe(60);
    expect(me.chatCount).toBe(0);
  });
});
