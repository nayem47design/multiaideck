// @vitest-environment node
import { and, eq } from "drizzle-orm";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { balanceMcr } from "@/lib/billing/ledger";
import { reconcile } from "@/lib/billing/reconcile";
import type { Db } from "@/lib/db";
import { ledgerEntries, paymentEvents, payments, users } from "@/lib/db/schema";
import { useTestDb } from "@/lib/db/testing";
import { env } from "@/lib/server/env";

import {
  MAX_CUSTOM_BDT,
  MIN_CUSTOM_BDT,
  packList,
  quoteCustom,
  quotePack,
  QuoteError,
} from "./packs";
import {
  addMonth,
  createPayment,
  decideSandbox,
  handleReturn,
  handleWebhook,
  quoteFor,
  refreshPayment,
  settle,
} from "./service";

let db: Db;
let user: typeof users.$inferSelect;

beforeAll(async () => {
  db = await useTestDb();
  [user] = await db
    .insert(users)
    .values({ phone: "+8801700000001", name: "Test" })
    .returning();
});

afterEach(() => {
  vi.unstubAllGlobals();
  env.PAYSTATION_MERCHANT_ID = undefined;
  env.PAYSTATION_PASSWORD = undefined;
});

const C = 1000; // mcr per credit

describe("packs", () => {
  it("matches the Figma top-up table (credits + bonus)", () => {
    expect(packList().map((p) => p.credits + p.bonusCredits)).toEqual([
      9_900, 41_895, 76_890, 149_385, 299_880,
    ]);
    expect(quotePack("699")).toEqual({
      amountPaisa: 69_900,
      creditsMcr: 69_900 * C,
      bonusMcr: 6_990 * C,
      bonusPercent: 10,
    });
    expect(packList().find((p) => p.tag === "most-chosen")?.bdt).toBe(699);
  });

  it("bounds custom amounts and gives them no bonus", () => {
    const reason = (f: () => unknown) => {
      try {
        f();
      } catch (e) {
        return (e as QuoteError).reason;
      }
    };
    expect(reason(() => quoteCustom(MIN_CUSTOM_BDT - 1))).toBe("too_low");
    expect(reason(() => quoteCustom(MAX_CUSTOM_BDT + 1))).toBe("too_high");
    expect(reason(() => quoteCustom(50.5))).toBe("invalid");
    expect(reason(() => quotePack("700"))).toBe("unknown_pack");
    expect(quoteCustom(50)).toMatchObject({
      creditsMcr: 5_000 * C,
      bonusMcr: 0,
    });
    expect(() =>
      quoteFor({ kind: "topup", method: "bkash", customBdt: 49 }),
    ).toThrow(/too_low/);
    expect(() => quoteFor({ kind: "topup", method: "bkash" })).toThrow();
  });

  it("adds calendar months", () => {
    expect(addMonth(new Date("2026-01-31T10:00:00Z")).toISOString()).toBe(
      "2026-02-28T10:00:00.000Z",
    );
    expect(addMonth(new Date("2026-10-15T06:00:00Z")).toISOString()).toBe(
      "2026-11-15T06:00:00.000Z",
    );
  });
});

/** Fake PayStation: transaction-status answers `trx` for every invoice. */
function fakePayStation(trx: {
  status: string;
  amount: string;
  trxId?: string;
}) {
  env.PAYSTATION_MERCHANT_ID = "test-merchant";
  env.PAYSTATION_PASSWORD = "test-password";
  const calls: string[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init: RequestInit) => {
      calls.push(String(url));
      const form = new URLSearchParams(String(init.body));
      if (String(url).endsWith("/initiate-payment"))
        return Response.json({
          status_code: "200",
          status: "success",
          payment_url: `https://sandbox.paystation.com.bd/checkout/${form.get("invoice_number")}`,
        });
      return Response.json({
        status_code: "200",
        status: "success",
        data: {
          invoice_number: form.get("invoice_number"),
          trx_status: trx.status,
          trx_id: trx.trxId ?? "TRX123",
          payment_amount: trx.amount,
        },
      });
    }),
  );
  return calls;
}

async function ledgerFor(paymentId: string) {
  return db
    .select()
    .from(ledgerEntries)
    .where(
      and(
        eq(ledgerEntries.refType, "payment"),
        eq(ledgerEntries.refId, paymentId),
      ),
    );
}

describe("PayStation payments", () => {
  it("credits once: webhook twice + return page + status check", async () => {
    const calls = fakePayStation({ status: "Success", amount: "699.00" });
    const before = await balanceMcr(db, user.id);
    const { payment, redirectUrl } = await createPayment(db, user, {
      kind: "topup",
      method: "bkash",
      packId: "699",
    });
    expect(payment.provider).toBe("paystation");
    expect(redirectUrl).toContain(payment.invoice);
    expect(calls).toHaveLength(1); // initiate only: nothing verified yet
    expect(await balanceMcr(db, user.id)).toBe(before);

    // Even a forged "Failed" on the return URL can't change the outcome: status is re-checked.
    await handleWebhook(db, { invoice_number: payment.invoice });
    await handleWebhook(db, { invoice_number: payment.invoice });
    const back = await handleReturn(
      db,
      new URLSearchParams({
        invoice_number: payment.invoice,
        status: "Failed",
      }),
    );
    expect(back?.status).toBe("paid");
    await refreshPayment(db, back!);
    await Promise.all([
      handleWebhook(db, { invoice_number: payment.invoice }),
      handleReturn(
        db,
        new URLSearchParams({ invoice_number: payment.invoice }),
      ),
    ]);

    expect(await balanceMcr(db, user.id)).toBe(before + 76_890 * C);
    const entries = await ledgerFor(payment.id);
    expect(entries.map((e) => e.kind).sort()).toEqual(["bonus", "topup"]);
    const events = await db
      .select()
      .from(paymentEvents)
      .where(eq(paymentEvents.paymentId, payment.id));
    expect(events.map((e) => e.source)).toEqual(
      expect.arrayContaining(["webhook", "callback", "status-check"]),
    );
  });

  it("never trusts the return URL: a forged success on a failed payment credits nothing", async () => {
    fakePayStation({ status: "Failed", amount: "399.00" });
    const before = await balanceMcr(db, user.id);
    const { payment } = await createPayment(db, user, {
      kind: "topup",
      method: "nagad",
      packId: "399",
    });
    const back = await handleReturn(
      db,
      new URLSearchParams({
        invoice_number: payment.invoice,
        status: "Successful",
        trx_id: "FORGED",
      }),
    );
    expect(back?.status).toBe("failed");
    await handleWebhook(db, { invoice_number: payment.invoice });
    expect(await balanceMcr(db, user.id)).toBe(before);
    expect(await ledgerFor(payment.id)).toHaveLength(0);
  });

  it("does not credit a different amount than asked", async () => {
    fakePayStation({ status: "Success", amount: "1.00" });
    const before = await balanceMcr(db, user.id);
    const { payment } = await createPayment(db, user, {
      kind: "topup",
      method: "card",
      customBdt: 100,
    });
    const after = await refreshPayment(db, payment);
    expect(after.status).toBe("pending");
    expect(after.failureReason).toBe("amount_mismatch");
    expect(await balanceMcr(db, user.id)).toBe(before);
    const report = await reconcile(db);
    expect(report.mismatches.map((m) => m.kind)).toContain("amount_mismatch");
  });

  it("closes a payment PayStation refused to start, charging nothing", async () => {
    env.PAYSTATION_MERCHANT_ID = "m";
    env.PAYSTATION_PASSWORD = "p";
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({ status_code: "1001", message: "Invalid merchant" }),
      ),
    );
    await expect(
      createPayment(db, user, { kind: "topup", method: "bkash", packId: "99" }),
    ).rejects.toMatchObject({ code: "payment_failed" });
    const [last] = await db
      .select()
      .from(payments)
      .where(eq(payments.failureReason, "initiate_failed"));
    expect(last.status).toBe("failed");
  });
});

describe("sandbox payments", () => {
  it("sends the person to the in-app checkout and credits once on approval", async () => {
    const before = await balanceMcr(db, user.id);
    const { payment, redirectUrl } = await createPayment(db, user, {
      kind: "topup",
      method: "bkash",
      packId: "99",
    });
    expect(payment.provider).toBe("sandbox");
    expect(redirectUrl).toBe(`/wallet/pay?payment=${payment.id}`);
    const paid = await decideSandbox(db, payment, "paid");
    expect(paid.status).toBe("paid");
    expect(paid.providerTrxId).toMatch(/^SBX-/);
    // A second decision (double click, or a late "failed") changes nothing.
    expect((await decideSandbox(db, paid, "failed")).status).toBe("paid");
    await settle(db, payment.id, { status: "paid", raw: {} });
    expect(await balanceMcr(db, user.id)).toBe(before + 9_900 * C);
  });

  it("a failed or cancelled payment credits nothing", async () => {
    const before = await balanceMcr(db, user.id);
    for (const outcome of ["failed", "cancelled"] as const) {
      const { payment } = await createPayment(db, user, {
        kind: "topup",
        method: "bkash",
        packId: "2499",
      });
      const row = await decideSandbox(db, payment, outcome);
      expect(row.status).toBe(outcome);
      expect(await ledgerFor(payment.id)).toHaveLength(0);
    }
    expect(await balanceMcr(db, user.id)).toBe(before);
  });

  it("activates Pro: plan, renewal in a month, 159,900 credits once", async () => {
    const before = await balanceMcr(db, user.id);
    const { payment } = await createPayment(db, user, {
      kind: "pro",
      method: "bkash",
    });
    expect(payment.amountPaisa).toBe(159_900);
    const start = Date.now();
    await decideSandbox(db, payment, "paid");
    await settle(db, payment.id, { status: "paid", raw: {} });
    const [u] = await db.select().from(users).where(eq(users.id, user.id));
    expect(u.plan).toBe("pro");
    const renews = u.proRenewsAt!.getTime();
    expect(renews - start).toBeGreaterThan(27 * 86_400_000);
    expect(renews - start).toBeLessThan(32 * 86_400_000);
    expect((await ledgerFor(payment.id)).map((e) => e.kind)).toEqual([
      "pro_grant",
    ]);
    expect(await balanceMcr(db, user.id)).toBe(before + 159_900 * C);

    // A second paid month extends from the current renewal date.
    const { payment: second } = await createPayment(db, user, {
      kind: "pro",
      method: "bkash",
    });
    await decideSandbox(db, second, "paid");
    const [u2] = await db.select().from(users).where(eq(users.id, user.id));
    expect(u2.proRenewsAt!.getTime()).toBe(addMonth(u.proRenewsAt!).getTime());
  });

  it("refuses sandbox decisions for PayStation payments", async () => {
    fakePayStation({ status: "Processing", amount: "99.00" });
    const { payment } = await createPayment(db, user, {
      kind: "topup",
      method: "bkash",
      packId: "99",
    });
    await expect(decideSandbox(db, payment, "paid")).rejects.toMatchObject({
      code: "conflict",
    });
    expect((await refreshPayment(db, payment)).status).toBe("pending");
  });
});

describe("ledger check", () => {
  it("finds no mismatch for paid payments and flags credits on unpaid ones", async () => {
    const clean = await reconcile(db);
    expect(
      clean.mismatches.filter((m) => m.kind !== "amount_mismatch"),
    ).toEqual([]);

    const { payment } = await createPayment(db, user, {
      kind: "topup",
      method: "bkash",
      packId: "99",
    });
    await decideSandbox(db, payment, "failed");
    await db.insert(ledgerEntries).values({
      userId: user.id,
      kind: "topup",
      amountMcr: 1_000,
      refType: "payment",
      refId: payment.id,
      idempotencyKey: `test:bad:${payment.id}`,
    });
    const report = await reconcile(db);
    expect(report.mismatches).toContainEqual(
      expect.objectContaining({
        kind: "credited_unpaid",
        paymentId: payment.id,
      }),
    );
  });
});
