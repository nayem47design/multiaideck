// Wallet demo state until the payments backend lands (Phase 6). It mirrors the Figma prototype
// (BDT 699 with bKash selected, two failed top-ups) and lets the demo run end to end: pick a pack,
// pay, approve or fail, and see the balance grow for the rest of the browser session.
//
// Payments are an append-only list, like the credits ledger (AGENTS.md rule 8): a payment is never
// changed or removed; a retry is a new entry. The balance is the demo balance plus every
// successful payment.

import { useSyncExternalStore } from "react";

import type { PaymentMethod } from "@/components/atoms/PaymentLogoSlot";

import { CREDIT_IN_BDT, DEMO_BALANCE } from "./demo";

export type { PaymentMethod };

/** Average credits per chat, used for the "≈ chats" estimates (Figma: 26). */
export const AVG_CREDITS_PER_CHAT = 26;
/** Smallest custom top-up in BDT. */
export const MIN_CUSTOM_BDT = 50;
/** Spending this month (Figma: 26 credits, 1 chat). */
export const DEMO_SPENT = { credits: 26, chats: 1 };

export interface Pack {
  id: string;
  bdt: number;
  /** Bonus in percent (0 for none). */
  bonusPct: number;
  /** "Most chosen" tag. */
  popular?: boolean;
}

export const PACKS: Pack[] = [
  { id: "99", bdt: 99, bonusPct: 0 },
  { id: "399", bdt: 399, bonusPct: 5 },
  { id: "699", bdt: 699, bonusPct: 10, popular: true },
  { id: "1299", bdt: 1299, bonusPct: 15 },
  { id: "2499", bdt: 2499, bonusPct: 20 },
];

export const PAYMENT_METHODS: PaymentMethod[] = ["bkash", "nagad", "card"];
/** Brand names are not translated. */
export const METHOD_NAMES: Record<PaymentMethod, string> = {
  bkash: "bKash",
  nagad: "Nagad",
  card: "Card",
};

export const PRO_PLAN = {
  bdt: 1599,
  credits: 159900,
  method: "bkash" as PaymentMethod,
  /** Next renewal date in the prototype ("Nov 15"). */
  renews: "2026-11-15T12:00:00+06:00",
  /** Rough questions per month (M37: "about 6,000 questions"). */
  questions: 6000,
  /** Pay as you go starts at the smallest pack. */
  paygFromBdt: 99,
};

/** Credits for a top-up: 100 credits per taka plus the bonus. */
export function quote(bdt: number, bonusPct = 0) {
  const base = Math.round(bdt / CREDIT_IN_BDT);
  const bonus = Math.round((base * bonusPct) / 100);
  return { bdt, base, bonus, bonusPct, credits: base + bonus };
}
export type Quote = ReturnType<typeof quote>;

/** Rough chats a number of credits buys, rounded to tens as in Figma (76,890 → 2,960). */
export function chatsFor(credits: number) {
  return Math.round(credits / AVG_CREDITS_PER_CHAT / 10) * 10;
}

export interface Selection {
  /** A pack id, or "custom". */
  pack: string;
  customBdt: number | null;
  method: PaymentMethod;
}

export interface Payment {
  id: string;
  /** ISO date. */
  at: string;
  kind: "top-up" | "pro";
  bdt: number;
  method: PaymentMethod;
  status: "succeeded" | "failed";
  /** Credits added (0 when failed). */
  credits: number;
  bonus: number;
  bonusPct: number;
  /** PayStation reference shown on the receipt. */
  reference: string;
}

/** A checkout waiting for the person to approve it in bKash / Nagad / the card page. */
export interface PendingCheckout {
  id: string;
  kind: Payment["kind"];
  quote: Quote;
  method: PaymentMethod;
}

export interface WalletState {
  selection: Selection;
  pending: PendingCheckout | null;
  payments: Payment[];
  /** Id of the last payment settled in this session (for the result screens). */
  lastId: string | null;
  pro: boolean;
}

const INITIAL: WalletState = {
  selection: { pack: "699", customBdt: null, method: "bkash" },
  pending: null,
  payments: [
    failed("p-oct13", "2026-10-13T16:32:00+06:00", 199),
    failed("p-oct14", "2026-10-14T12:38:00+06:00", 2499),
  ],
  lastId: null,
  pro: false,
};

function failed(id: string, at: string, bdt: number): Payment {
  return {
    id,
    at,
    kind: "top-up",
    bdt,
    method: "bkash",
    status: "failed",
    credits: 0,
    bonus: 0,
    bonusPct: 0,
    reference: "",
  };
}

// ---------------------------------------------------------------------------
// Store: one object per change, kept in sessionStorage for the browser session.

const KEY = "multiai-wallet";
let state: WalletState = INITIAL;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (raw) state = { ...INITIAL, ...(JSON.parse(raw) as WalletState) };
  } catch {
    // Private mode or blocked storage: start from the demo state.
  }
}

function set(next: WalletState) {
  state = next;
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Ignore: the demo still works for this page view.
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  load();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  load();
  return state;
}

export function useWallet() {
  return useSyncExternalStore(subscribe, getSnapshot, () => INITIAL);
}

let counter = 0;
function newId(prefix: string) {
  counter += 1;
  return `${prefix}-${Date.now().toString(36)}-${counter}`;
}
function reference() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const pick = () => chars[Math.floor(Math.random() * chars.length)];
  return `${Array.from({ length: 4 }, pick).join("")}-${Array.from({ length: 4 }, pick).join("")}`;
}

// ---------------------------------------------------------------------------
// Derived values

export function balanceOf(s: WalletState) {
  return s.payments.reduce(
    (sum, p) => (p.status === "succeeded" ? sum + p.credits : sum),
    DEMO_BALANCE.credits,
  );
}

/** The quote for the current selection, or null when a custom amount is not valid yet. */
export function selectionQuote(sel: Selection): Quote | null {
  if (sel.pack === "custom") {
    return sel.customBdt && sel.customBdt >= MIN_CUSTOM_BDT
      ? quote(sel.customBdt)
      : null;
  }
  const pack = PACKS.find((p) => p.id === sel.pack) ?? PACKS[2];
  return quote(pack.bdt, pack.bonusPct);
}

export function lastPayment(s: WalletState) {
  return s.payments.find((p) => p.id === s.lastId) ?? null;
}

/** Newest first, for the tables. */
export function paymentsNewestFirst(s: WalletState) {
  return [...s.payments].sort((a, b) => b.at.localeCompare(a.at));
}

// ---------------------------------------------------------------------------
// Actions

export const wallet = {
  selectPack(pack: string) {
    set({ ...state, selection: { ...state.selection, pack } });
  },
  setCustom(customBdt: number | null) {
    set({
      ...state,
      selection: { ...state.selection, pack: "custom", customBdt },
    });
  },
  selectMethod(method: PaymentMethod) {
    set({ ...state, selection: { ...state.selection, method } });
  },
  /** Pick the same amount and method as an earlier payment (Try again). */
  repeat(payment: Payment) {
    const pack = PACKS.find((p) => p.bdt === payment.bdt);
    set({
      ...state,
      selection: pack
        ? { pack: pack.id, customBdt: null, method: payment.method }
        : { pack: "custom", customBdt: payment.bdt, method: payment.method },
    });
  },
  /** Send a payment request for the current selection. Returns false when there is no amount. */
  startCheckout() {
    const q = selectionQuote(state.selection);
    if (!q) return false;
    set({
      ...state,
      pending: {
        id: newId("p"),
        kind: "top-up",
        quote: q,
        method: state.selection.method,
      },
    });
    return true;
  },
  /** Close the checkout without a result (the person cancelled before paying). */
  cancelCheckout() {
    if (state.pending) set({ ...state, pending: null });
  },
  /** Make sure a checkout is pending, e.g. when the pay screen is opened from a link. */
  ensureCheckout() {
    if (!state.pending) wallet.startCheckout();
  },
  /** The payment provider answered: append the payment. Does nothing without a pending checkout. */
  settle(status: Payment["status"]) {
    const pending = state.pending;
    if (!pending) return null;
    const ok = status === "succeeded";
    const payment: Payment = {
      id: pending.id,
      at: new Date().toISOString(),
      kind: pending.kind,
      bdt: pending.quote.bdt,
      method: pending.method,
      status,
      credits: ok ? pending.quote.credits : 0,
      bonus: ok ? pending.quote.bonus : 0,
      bonusPct: pending.quote.bonusPct,
      reference: ok ? reference() : "",
    };
    set({
      ...state,
      pending: null,
      payments: [...state.payments, payment],
      lastId: payment.id,
    });
    return payment;
  },
  /** Go Pro: the monthly plan is paid with bKash and adds its credits at once. */
  upgradePro() {
    const payment: Payment = {
      id: newId("pro"),
      at: new Date().toISOString(),
      kind: "pro",
      bdt: PRO_PLAN.bdt,
      method: PRO_PLAN.method,
      status: "succeeded",
      credits: PRO_PLAN.credits,
      bonus: 0,
      bonusPct: 0,
      reference: reference(),
    };
    set({
      ...state,
      pro: true,
      payments: [...state.payments, payment],
    });
  },
  /** Storybook and tests: back to the prototype state. */
  reset() {
    set(INITIAL);
  },
};
