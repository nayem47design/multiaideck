"use client";

// Wallet state in the browser: the person's top-up choice (pack or custom amount, method), and the
// wallet, payments and packs from the API. The server computes every credit amount; the quotes
// here only mirror src/lib/payments/packs.ts for display before paying.
//
//   const w = useWallet();          // { selection, wallet, payments, … }
//   walletActions.selectPack("699")
//   const { payment, redirectUrl } = await walletActions.start({ kind: "topup" })
//   await walletActions.decide(id, "paid")   // sandbox checkout only
//
// After a payment settles, refresh() re-reads the wallet and payments and the user's balance
// (useMe), so every screen shows the new balance.

import { useEffect, useSyncExternalStore } from "react";

import type { PaymentMethod } from "@/components/atoms/PaymentLogoSlot";
import { api } from "@/lib/api-client";
import { credits } from "@/lib/billing/units";
import {
  CreatePaymentResponse,
  PaymentListResponse,
  PaymentSchema,
  WalletResponse,
  type Payment,
} from "@/lib/contracts/wallet";
import { me } from "@/lib/me";

import {
  MAX_CUSTOM_BDT,
  MIN_CUSTOM_BDT,
  PACKS,
  PRO,
  quoteCustom,
  quotePack,
  QuoteError,
} from "./packs";

export type { Payment, PaymentMethod };
export { MAX_CUSTOM_BDT, MIN_CUSTOM_BDT, PACKS, PRO };

export const PAYMENT_METHODS: PaymentMethod[] = ["bkash", "nagad", "card"];
/** Brand names are not translated. */
export const METHOD_NAMES: Record<PaymentMethod, string> = {
  bkash: "bKash",
  nagad: "Nagad",
  card: "Card",
};
/** Average credits per chat before the person has any history (Figma: 26). */
export const DEFAULT_AVG_CREDITS = 26;
/** Pro, as the overlays show it. */
export const PRO_PLAN = {
  bdt: PRO.bdt,
  credits: PRO.credits,
  method: "bkash" as PaymentMethod,
  /** Rough questions per month (M37: "about 6,000 questions"). */
  questions: 6000,
  /** Pay as you go starts at the smallest pack. */
  paygFromBdt: PACKS[0].bdt,
};

export interface Quote {
  bdt: number;
  base: number;
  bonus: number;
  bonusPct: number;
  credits: number;
}

function toQuote(bdt: number, q: ReturnType<typeof quotePack>): Quote {
  const base = credits(q.creditsMcr);
  const bonus = credits(q.bonusMcr);
  return { bdt, base, bonus, bonusPct: q.bonusPercent, credits: base + bonus };
}

export function packQuote(id: string): Quote {
  const pack = PACKS.find((p) => p.id === id) ?? PACKS[2];
  return toQuote(pack.bdt, quotePack(pack.id));
}

export interface Selection {
  /** A pack id, or "custom". */
  pack: string;
  customBdt: number | null;
  method: PaymentMethod;
}

/** The quote for a selection, or null when a custom amount isn't valid yet. */
export function selectionQuote(sel: Selection): Quote | null {
  if (sel.pack !== "custom") return packQuote(sel.pack);
  if (sel.customBdt === null) return null;
  try {
    return toQuote(sel.customBdt, quoteCustom(sel.customBdt));
  } catch (e) {
    if (e instanceof QuoteError) return null;
    throw e;
  }
}

/** Why a custom amount can't be paid, for the field's error. */
export function customProblem(sel: Selection): "too_low" | "too_high" | null {
  if (sel.pack !== "custom" || sel.customBdt === null) return null;
  if (sel.customBdt < MIN_CUSTOM_BDT) return "too_low";
  if (sel.customBdt > MAX_CUSTOM_BDT) return "too_high";
  return null;
}

/** Rough chats a number of credits buys, rounded to tens as in Figma (76,890 → 2,960). */
export function chatsFor(creditsAmount: number, average: number | null) {
  const avg = average && average > 0 ? average : DEFAULT_AVG_CREDITS;
  return Math.round(creditsAmount / avg / 10) * 10;
}

// ---------------------------------------------------------------------------
// Display helpers for payments

/** Finished payments, newest first (pending checkouts aren't history yet). */
export function history(payments: Payment[] | null) {
  return (payments ?? []).filter((p) => p.status !== "pending");
}
export const succeeded = (p: Payment) => p.status === "paid";
/** Credits added by a payment, without the bonus. */
export const baseCredits = (p: Payment) => p.credits - p.bonusCredits;
export const bonusPct = (p: Payment) =>
  baseCredits(p) ? Math.round((p.bonusCredits / baseCredits(p)) * 100) : 0;
/** Reference on receipts: the provider's transaction id, else our invoice. */
export const reference = (p: Payment) => p.providerTrxId ?? p.invoice;

// ---------------------------------------------------------------------------
// Store

interface State {
  selection: Selection;
  wallet: WalletResponse | null;
  payments: Payment[] | null;
  /** Payments loaded by id (the checkout and result screens). */
  byId: Record<string, Payment>;
  status: "idle" | "loading" | "ready" | "error";
}

const INITIAL: State = {
  selection: { pack: "699", customBdt: null, method: "bkash" },
  wallet: null,
  payments: null,
  byId: {},
  status: "idle",
};

let state: State = INITIAL;
const listeners = new Set<() => void>();

function set(next: Partial<State>) {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

function remember(p: Payment) {
  set({ byId: { ...state.byId, [p.id]: p } });
  return p;
}

let inflight: Promise<void> | null = null;
function load(): Promise<void> {
  if (state.status === "idle") set({ status: "loading" });
  inflight ??= Promise.all([
    api("/api/wallet", { schema: WalletResponse }),
    api("/api/payments", { schema: PaymentListResponse }),
  ])
    .then(([wallet, { payments }]) => {
      const byId = { ...state.byId };
      for (const p of payments) byId[p.id] = p;
      set({ wallet, payments, byId, status: "ready" });
    })
    .catch(() => set({ status: "error" }))
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

export const walletActions = {
  selectPack(pack: string) {
    set({ selection: { ...state.selection, pack } });
  },
  setCustom(customBdt: number | null) {
    set({ selection: { ...state.selection, pack: "custom", customBdt } });
  },
  selectMethod(method: PaymentMethod) {
    set({ selection: { ...state.selection, method } });
  },
  /** Pick the same amount and method as an earlier payment (Try again). */
  repeat(p: Payment) {
    const pack = PACKS.find((k) => k.bdt === p.bdt);
    set({
      selection: pack
        ? { pack: pack.id, customBdt: null, method: p.method }
        : { pack: "custom", customBdt: p.bdt, method: p.method },
    });
  },
  /** Start a payment on the server: a top-up for the current selection, or Pro. */
  async start(
    req: { kind: "topup" } | { kind: "pro"; method?: PaymentMethod },
  ) {
    const sel = state.selection;
    const body =
      req.kind === "pro"
        ? { kind: "pro" as const, method: req.method ?? PRO_PLAN.method }
        : sel.pack === "custom"
          ? {
              kind: "topup" as const,
              method: sel.method,
              customBdt: sel.customBdt ?? 0,
            }
          : { kind: "topup" as const, method: sel.method, packId: sel.pack };
    const res = await api("/api/payments", {
      method: "POST",
      body,
      schema: CreatePaymentResponse,
    });
    remember(res.payment);
    return res;
  },
  /** Load one payment (re-checks a pending PayStation payment on the server). */
  async get(id: string) {
    return remember(
      await api(`/api/payments/${encodeURIComponent(id)}`, {
        schema: PaymentSchema,
      }),
    );
  },
  /** Sandbox checkout: approve, fail or cancel a pending sandbox payment. */
  async decide(id: string, outcome: "paid" | "failed" | "cancelled") {
    const p = remember(
      await api(`/api/payments/${encodeURIComponent(id)}/sandbox`, {
        method: "POST",
        body: { outcome },
        schema: PaymentSchema,
      }),
    );
    if (p.status === "paid") await walletActions.refresh();
    else void load();
    return p;
  },
  /** Re-read the wallet, the payments and the user's balance. */
  async refresh() {
    await Promise.all([load(), me.refresh()]);
  },
};

export function useWallet() {
  const s = useSyncExternalStore(
    subscribe,
    () => state,
    () => INITIAL,
  );
  useEffect(() => {
    if (state.status === "idle") void load();
  }, []);
  return s;
}

/** A payment by id: from the store, loading it when missing. */
export function usePayment(id: string | null) {
  const s = useWallet();
  const payment = id ? (s.byId[id] ?? null) : null;
  useEffect(() => {
    if (id && !state.byId[id]) void walletActions.get(id).catch(() => {});
  }, [id]);
  return payment;
}
