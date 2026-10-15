import "server-only";

import { bdt } from "@/lib/billing/units";
import { env } from "@/lib/server/env";

import type {
  Customer,
  PaymentProvider,
  PaymentRow,
  Verification,
  VerifiedStatus,
} from "./provider";

// PayStation (paystation.com.bd): bKash, Nagad and card through one hosted checkout.
//
// Flow: the server initiates a payment (merchant id + password, our invoice number, amount,
// customer, callback URL) and gets back a payment_url to send the person to. When they finish,
// PayStation sends the browser to our callback URL; it may also call an IPN/webhook URL. Neither
// is trusted: both only tell us which invoice to re-check with a server-to-server
// transaction-status call, and only that answer moves the payment to paid.
//
// ┌──────────────────────────────────────────────────────────────────────────────────────────┐
// │ CHECK AGAINST PAYSTATION'S MERCHANT API DOCS / SANDBOX BEFORE GOING LIVE.                │
// │ This repo has no copy of PayStation's API reference. Every endpoint path, field name and │
// │ status value below is written from their published merchant API as best known and is     │
// │ kept in this one block (PS) so it can be corrected in one place. Items marked VERIFY are │
// │ the ones most likely to differ.                                                          │
// └──────────────────────────────────────────────────────────────────────────────────────────┘
const PS = {
  /** Base URL: env PAYSTATION_BASE_URL (sandbox https://sandbox.paystation.com.bd; live: VERIFY,
   *  documented as https://api.paystation.com.bd). */
  paths: {
    /** VERIFY: POST, form-encoded, returns JSON with payment_url. */
    initiate: "/initiate-payment",
    /** VERIFY: POST, header merchantId, form field invoice_number. A v2 variant takes trx_id. */
    status: "/transaction-status",
  },
  /** Initiate request fields. VERIFY names and which are required. */
  initiate: {
    merchantId: "merchantId",
    password: "password",
    invoice: "invoice_number",
    currency: "currency",
    amount: "payment_amount",
    /** 0: the customer doesn't pay the gateway charge on top (we absorb it). VERIFY. */
    payWithCharge: "pay_with_charge",
    reference: "reference",
    name: "cust_name",
    phone: "cust_phone",
    email: "cust_email",
    address: "cust_address",
    callbackUrl: "callback_url",
    items: "checkout_items",
    /** Optional pass-through fields; we send our payment id and method. VERIFY. */
    optA: "opt_a",
    optB: "opt_b",
  },
  /** Initiate response. VERIFY. */
  initiateResponse: {
    statusCode: "status_code", // "200" on success
    status: "status", // "success"
    message: "message",
    paymentUrl: "payment_url",
  },
  /** Transaction-status request/response. VERIFY. */
  statusRequest: { merchantHeader: "merchantId", invoice: "invoice_number" },
  statusResponse: {
    statusCode: "status_code",
    data: "data",
    trxStatus: "trx_status", // e.g. "Success" | "Failed" | "Processing" | "Canceled" — VERIFY
    trxId: "trx_id",
    amount: "payment_amount",
    invoice: "invoice_number",
  },
  /** Query parameters PayStation adds to the callback URL. VERIFY. Used only to find the payment. */
  callbackQuery: {
    invoice: "invoice_number",
    status: "status",
    trxId: "trx_id",
  },
  /** IPN/webhook body field naming the invoice. VERIFY whether PayStation sends an IPN at all and
   *  how it is signed; we re-check status either way. */
  webhookInvoice: ["invoice_number", "invoiceNumber", "invoice"],
} as const;

/** Map PayStation's trx_status to ours. Unknown values stay pending (re-checked later). VERIFY. */
function mapStatus(value: unknown): VerifiedStatus {
  const s = String(value ?? "").toLowerCase();
  if (["success", "successful", "completed", "complete", "paid"].includes(s))
    return "paid";
  if (["failed", "failure", "declined", "expired", "rejected"].includes(s))
    return "failed";
  if (["canceled", "cancelled", "cancel"].includes(s)) return "cancelled";
  return "pending";
}

const TIMEOUT_MS = 15_000;

function url(path: string) {
  return new URL(path, env.PAYSTATION_BASE_URL).toString();
}

async function post(
  path: string,
  form: Record<string, string>,
  headers: Record<string, string> = {},
): Promise<Record<string, unknown>> {
  const res = await fetch(url(path), {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      accept: "application/json",
      ...headers,
    },
    body: new URLSearchParams(form),
    signal: AbortSignal.timeout(TIMEOUT_MS),
    cache: "no-store",
  });
  const text = await res.text();
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    body = { nonJson: text.slice(0, 500) };
  }
  if (!res.ok)
    throw new PayStationError(`HTTP ${res.status}`, {
      status: res.status,
      body,
    });
  return (body ?? {}) as Record<string, unknown>;
}

export class PayStationError extends Error {
  constructor(
    message: string,
    public readonly raw: unknown,
  ) {
    super(`PayStation: ${message}`);
  }
}

/** Our callback URL (the browser comes back here; we verify, then redirect into the app). */
export function callbackUrl() {
  return new URL("/api/payments/paystation/return", env.APP_URL).toString();
}

function credentials() {
  const merchantId = env.PAYSTATION_MERCHANT_ID;
  const password = env.PAYSTATION_PASSWORD;
  if (!merchantId || !password)
    throw new PayStationError("not configured", null);
  return { merchantId, password };
}

export const paystation: PaymentProvider = {
  name: "paystation",

  async create(payment: PaymentRow, customer: Customer) {
    const { merchantId, password } = credentials();
    const f = PS.initiate;
    const body = await post(PS.paths.initiate, {
      [f.merchantId]: merchantId,
      [f.password]: password,
      [f.invoice]: payment.invoice,
      [f.currency]: "BDT",
      [f.amount]: bdt(payment.amountPaisa).toFixed(2),
      [f.payWithCharge]: "0",
      [f.reference]: payment.id,
      [f.name]: customer.name || "MultiAIDeck customer",
      [f.phone]: customer.phone ?? "",
      [f.email]: customer.email ?? "",
      [f.address]: "Bangladesh",
      [f.callbackUrl]: callbackUrl(),
      [f.items]: payment.kind === "pro" ? "MultiAIDeck Pro" : "Credits",
      [f.optA]: payment.id,
      [f.optB]: payment.method,
    });
    const r = PS.initiateResponse;
    const paymentUrl = body[r.paymentUrl];
    if (String(body[r.statusCode]) !== "200" || typeof paymentUrl !== "string")
      throw new PayStationError(
        String(body[r.message] ?? "initiate failed"),
        body,
      );
    return { redirectUrl: paymentUrl, raw: body };
  },

  async verify(payment: PaymentRow): Promise<Verification> {
    const { merchantId } = credentials();
    const q = PS.statusRequest;
    const body = await post(
      PS.paths.status,
      { [q.invoice]: payment.invoice },
      { [q.merchantHeader]: merchantId },
    );
    const r = PS.statusResponse;
    const data = (body[r.data] ?? {}) as Record<string, unknown>;
    // A status call for an unknown or unfinished invoice is not a failure: keep it pending.
    if (String(body[r.statusCode]) !== "200")
      return { status: "pending", raw: body };
    // Only trust a response about this invoice.
    if (data[r.invoice] && String(data[r.invoice]) !== payment.invoice)
      return { status: "pending", raw: body };
    const amount = Number(data[r.amount]);
    return {
      status: mapStatus(data[r.trxStatus]),
      trxId: data[r.trxId] ? String(data[r.trxId]) : null,
      amountPaisa: Number.isFinite(amount) ? Math.round(amount * 100) : null,
      reason: data[r.trxStatus] ? String(data[r.trxStatus]) : null,
      raw: body,
    };
  },
};

/** The invoice number named by a callback's query string (lookup only, never trusted). */
export function invoiceFromCallback(params: URLSearchParams) {
  return params.get(PS.callbackQuery.invoice);
}

/** The invoice number named by a webhook body (lookup only, never trusted). */
export function invoiceFromWebhook(body: Record<string, unknown>) {
  for (const key of PS.webhookInvoice) {
    const v = body[key];
    if (typeof v === "string" && v) return v;
  }
  const data = body.data as Record<string, unknown> | undefined;
  if (data)
    for (const key of PS.webhookInvoice)
      if (typeof data[key] === "string") return data[key] as string;
  return null;
}
