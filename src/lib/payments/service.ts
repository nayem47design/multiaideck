import "server-only";

import { and, count, desc, eq, gt, ne } from "drizzle-orm";

import { creditPayment } from "@/lib/billing/ledger";
import { credits, bdt } from "@/lib/billing/units";
import type { CreatePaymentRequest, Payment } from "@/lib/contracts/wallet";
import type { Db } from "@/lib/db";
import { paymentEvents, payments, users } from "@/lib/db/schema";
import { ApiError } from "@/lib/server/api";

import {
  quoteCustom,
  quotePack,
  quotePro,
  QuoteError,
  type Quote,
} from "./packs";
import {
  currentProvider,
  providerFor,
  type PaymentRow,
  type Verification,
} from "./provider";
import { invoiceFromCallback, invoiceFromWebhook } from "./paystation";
import { sandboxTrxId } from "./sandbox";

// Payments: create → (provider) → verify → settle. Settling is the only place credits move, and
// it is idempotent and atomic: in one transaction the payment moves to paid with a conditional
// update (only if it isn't paid yet), and only the transaction that wins that update appends the
// ledger entries (which carry per-payment idempotency keys as a second guard). So a repeated
// webhook, a reloaded return page and a status re-check, in any order, credit exactly once.

type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];
type Executor = Db | Tx;
type UserRow = typeof users.$inferSelect;

/** At most this many unfinished payments per user per hour (stops request floods). */
const MAX_PENDING_PER_HOUR = 10;

export function toPayment(row: PaymentRow): Payment {
  return {
    id: row.id,
    invoice: row.invoice,
    kind: row.kind,
    method: row.method,
    provider: row.provider,
    bdt: bdt(row.amountPaisa),
    credits: credits(row.creditsMcr + row.bonusMcr),
    bonusCredits: credits(row.bonusMcr),
    status: row.status,
    failureReason: row.failureReason,
    providerTrxId: row.providerTrxId,
    createdAt: row.createdAt.toISOString(),
  };
}

/** Our invoice number: MAD-YYMMDD-XXXXXXXX (unique; the provider's idempotency key). */
export function newInvoice(now = new Date()) {
  const d = now.toISOString().slice(2, 10).replaceAll("-", "");
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  const tail = Array.from(bytes, (b) => chars[b % chars.length]).join("");
  return `MAD-${d}-${tail}`;
}

export function quoteFor(req: CreatePaymentRequest): Quote {
  try {
    if (req.kind === "pro") return quotePro();
    if (req.packId) return quotePack(req.packId);
    if (req.customBdt !== undefined) return quoteCustom(req.customBdt);
  } catch (e) {
    if (e instanceof QuoteError)
      throw new ApiError(400, "invalid_input", e.reason, { reason: e.reason });
    throw e;
  }
  throw new ApiError(400, "invalid_input", "Choose a pack or an amount", {
    reason: "no_amount",
  });
}

export async function getPayment(db: Executor, id: string) {
  const [row] = await db.select().from(payments).where(eq(payments.id, id));
  return row ?? null;
}

export async function getPaymentByInvoice(db: Executor, invoice: string) {
  const [row] = await db
    .select()
    .from(payments)
    .where(eq(payments.invoice, invoice));
  return row ?? null;
}

export async function listPayments(db: Executor, userId: string, limit = 100) {
  return db
    .select()
    .from(payments)
    .where(eq(payments.userId, userId))
    .orderBy(desc(payments.createdAt))
    .limit(limit);
}

export async function recordEvent(
  db: Executor,
  paymentId: string | null,
  source: (typeof paymentEvents.$inferInsert)["source"],
  payload: unknown,
) {
  await db
    .insert(paymentEvents)
    .values({ paymentId, source, payload: (payload ?? {}) as object });
}

/** Start a payment: a pending row with a unique invoice, then the provider's checkout URL. */
export async function createPayment(
  db: Db,
  user: UserRow,
  req: CreatePaymentRequest,
): Promise<{ payment: PaymentRow; redirectUrl: string }> {
  const quote = quoteFor(req);

  const [{ n }] = await db
    .select({ n: count() })
    .from(payments)
    .where(
      and(
        eq(payments.userId, user.id),
        eq(payments.status, "pending"),
        gt(payments.createdAt, new Date(Date.now() - 3_600_000)),
      ),
    );
  if (n >= MAX_PENDING_PER_HOUR)
    throw new ApiError(429, "rate_limited", "Too many unfinished payments");

  const provider = currentProvider();
  const [payment] = await db
    .insert(payments)
    .values({
      userId: user.id,
      invoice: newInvoice(),
      provider: provider.name,
      method: req.method,
      kind: req.kind,
      amountPaisa: quote.amountPaisa,
      creditsMcr: quote.creditsMcr,
      bonusMcr: quote.bonusMcr,
    })
    .returning();

  try {
    const { redirectUrl } = await provider.create(payment, {
      name: user.name,
      phone: user.phone,
      email: user.email,
    });
    return { payment, redirectUrl };
  } catch (e) {
    // The provider never took the payment: close it so it can't be credited, nothing charged.
    const raw = (e as { raw?: unknown }).raw ?? { message: String(e) };
    await recordEvent(db, payment.id, "status-check", {
      stage: "initiate",
      error: raw,
    });
    await settle(db, payment.id, {
      status: "failed",
      reason: "initiate_failed",
      raw,
    });
    throw new ApiError(502, "payment_failed", "Couldn’t start the payment");
  }
}

/** Add one calendar month (Jan 31 → Feb 28/29). */
export function addMonth(from: Date) {
  const d = new Date(from);
  const day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + 1);
  const last = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0),
  ).getUTCDate();
  d.setUTCDate(Math.min(day, last));
  return d;
}

export interface SettleResult {
  payment: PaymentRow;
  /** True only for the one call that moved the payment to paid and credited it. */
  credited: boolean;
}

/**
 * Apply a verified outcome. Paid: pending/failed/cancelled → paid and credit, once. Failed or
 * cancelled: only from pending (never un-pays). Pending: no change. An amount that differs from
 * what we asked for is not credited and stays pending for a person to look at (reconcile).
 */
export async function settle(
  db: Db,
  paymentId: string,
  v: Pick<Verification, "status" | "trxId" | "amountPaisa" | "reason" | "raw">,
): Promise<SettleResult> {
  return db.transaction(async (tx) => {
    const current = await getPayment(tx, paymentId);
    if (!current) throw new ApiError(404, "not_found");

    if (v.status === "paid") {
      if (v.amountPaisa != null && v.amountPaisa !== current.amountPaisa) {
        const [row] = await tx
          .update(payments)
          .set({ failureReason: "amount_mismatch", updatedAt: new Date() })
          .where(and(eq(payments.id, paymentId), ne(payments.status, "paid")))
          .returning();
        return { payment: row ?? current, credited: false };
      }
      const [row] = await tx
        .update(payments)
        .set({
          status: "paid",
          providerTrxId: v.trxId ?? current.providerTrxId,
          failureReason: null,
          updatedAt: new Date(),
        })
        .where(and(eq(payments.id, paymentId), ne(payments.status, "paid")))
        .returning();
      if (!row) return { payment: current, credited: false };

      if (row.kind === "pro") {
        await creditPayment(tx, {
          userId: row.userId,
          paymentId: row.id,
          creditsMcr: row.creditsMcr,
          bonusMcr: 0,
          kind: "pro_grant",
        });
        const [u] = await tx
          .select({ renews: users.proRenewsAt })
          .from(users)
          .where(eq(users.id, row.userId));
        const now = new Date();
        const base = u?.renews && u.renews > now ? u.renews : now;
        await tx
          .update(users)
          .set({ plan: "pro", proRenewsAt: addMonth(base), updatedAt: now })
          .where(eq(users.id, row.userId));
      } else {
        await creditPayment(tx, {
          userId: row.userId,
          paymentId: row.id,
          creditsMcr: row.creditsMcr,
          bonusMcr: row.bonusMcr,
        });
      }
      return { payment: row, credited: true };
    }

    if (v.status === "failed" || v.status === "cancelled") {
      const [row] = await tx
        .update(payments)
        .set({
          status: v.status,
          failureReason: v.reason ?? v.status,
          updatedAt: new Date(),
        })
        .where(and(eq(payments.id, paymentId), eq(payments.status, "pending")))
        .returning();
      return { payment: row ?? current, credited: false };
    }

    return { payment: current, credited: false };
  });
}

/**
 * Ask the provider what happened to a payment and apply it. Safe to call any number of times
 * (return page, webhook, GET /api/payments/:id). Provider errors leave the payment pending.
 */
export async function refreshPayment(
  db: Db,
  payment: PaymentRow,
): Promise<PaymentRow> {
  if (payment.status === "paid") return payment;
  const provider = providerFor(payment);
  let v: Verification | null;
  try {
    v = await provider.verify(payment);
  } catch (e) {
    await recordEvent(db, payment.id, "status-check", {
      error: (e as { raw?: unknown }).raw ?? String(e),
    });
    return payment;
  }
  if (!v) return payment;
  await recordEvent(db, payment.id, "status-check", v.raw);
  return (await settle(db, payment.id, v)).payment;
}

/** Sandbox checkout decision (approve / fail / cancel). Only for pending sandbox payments. */
export async function decideSandbox(
  db: Db,
  payment: PaymentRow,
  outcome: "paid" | "failed" | "cancelled",
): Promise<PaymentRow> {
  if (payment.provider !== "sandbox")
    throw new ApiError(409, "conflict", "Not a sandbox payment");
  if (payment.status !== "pending") return payment;
  const raw = { outcome };
  await recordEvent(db, payment.id, "sandbox", raw);
  const { payment: row } = await settle(db, payment.id, {
    status: outcome,
    trxId: outcome === "paid" ? sandboxTrxId() : null,
    reason: outcome === "paid" ? null : outcome,
    raw,
  });
  return row;
}

/**
 * PayStation return page: record the query, find the payment it names (lookup only) and re-check
 * it with PayStation. Returns the payment as our database has it afterwards.
 */
export async function handleReturn(
  db: Db,
  params: URLSearchParams,
): Promise<PaymentRow | null> {
  const invoice = invoiceFromCallback(params);
  const byId = params.get("payment");
  let payment = invoice
    ? await getPaymentByInvoice(db, invoice)
    : byId
      ? await getPayment(db, byId)
      : null;
  await recordEvent(db, payment?.id ?? null, "callback", {
    query: Object.fromEntries(params),
  });
  if (payment && payment.provider === "paystation")
    payment = await refreshPayment(db, payment);
  return payment;
}

/** PayStation IPN: record the body, then verify the invoice it names with a status check. */
export async function handleWebhook(
  db: Db,
  body: Record<string, unknown>,
): Promise<PaymentRow | null> {
  const invoice = invoiceFromWebhook(body);
  const payment = invoice ? await getPaymentByInvoice(db, invoice) : null;
  await recordEvent(db, payment?.id ?? null, "webhook", body);
  if (payment && payment.provider === "paystation")
    return refreshPayment(db, payment);
  return payment;
}
