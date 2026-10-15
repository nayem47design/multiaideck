"use client";

import { useEffect, useSyncExternalStore, type ReactNode } from "react";

import { api, ApiClientError } from "@/lib/api-client";
import { safeNext } from "@/lib/auth/cookies";
import { MeResponse } from "@/lib/contracts/auth";
import type { Balance, User } from "@/lib/contracts/common";

// The signed-in user across the app.
//
//   const { user, balance, refresh, setBalance } = useMe();
//
//   user         User | null       null until GET /api/me answers (render a quiet placeholder)
//   balance      Balance | null    { credits, bdt }
//   topUpLeft    number | null     share of the last top-up left, 0–100 (sidebar bar)
//   chatCount    number | null
//   status       "loading" | "ready" | "error"
//   refresh()    Promise<void>     re-reads GET /api/me (after paying, spending, editing the profile)
//   setBalance(b)                  set the balance now, without a request: a Balance, or a number of
//                                  credits (e.g. the stream's `done` event); bdt is derived
//   setUser(u)                     replace the user after a PATCH /api/me (pass its response user)
//
// <MeProvider> (mounted in the (app) and (page) layouts) loads it once; useMe() also works outside
// the provider (it shares one store per tab). A 401 sends the browser to /sign-in?next=<here>.
// Signing out or deleting the account does a full page load, so nothing of the old user stays.

const BDT_PER_CREDIT = 0.01;

interface MeState {
  user: User | null;
  balance: Balance | null;
  topUpLeft: number | null;
  chatCount: number | null;
  status: "loading" | "ready" | "error";
}

const EMPTY: MeState = {
  user: null,
  balance: null,
  topUpLeft: null,
  chatCount: null,
  status: "loading",
};

let state: MeState = EMPTY;
let inflight: Promise<void> | null = null;
const listeners = new Set<() => void>();

function set(next: Partial<MeState>) {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

/** Send a signed-out visitor to the sign-in page of the current language, keeping their place. */
export function goToSignIn() {
  const bn = /^\/bn(\/|$)/.test(location.pathname);
  const rest = location.pathname.replace(/^\/bn(?=\/|$)/, "") || "/";
  const next = safeNext(rest + location.search);
  const query = next === "/" ? "" : `?next=${encodeURIComponent(next)}`;
  // A full page load on purpose: nothing of the signed-out state should stay in memory.
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination
  location.assign(`${bn ? "/bn" : ""}/sign-in${query}`);
}

function load(): Promise<void> {
  inflight ??= api("/api/me", { schema: MeResponse })
    .then((me) =>
      set({
        user: me.user,
        balance: me.balance,
        topUpLeft: me.topUpLeft ?? null,
        chatCount: me.chatCount ?? null,
        status: "ready",
      }),
    )
    .catch((e: unknown) => {
      if (e instanceof ApiClientError && e.status === 401) goToSignIn();
      else set({ status: "error" });
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

export const me = {
  refresh: load,
  setBalance(b: Balance | number) {
    set({
      balance:
        typeof b === "number"
          ? { credits: b, bdt: Math.round(b * BDT_PER_CREDIT * 100) / 100 }
          : b,
    });
  },
  setUser(user: User) {
    set({ user });
  },
  /** Forget the user (before leaving after sign-out or deletion). */
  clear() {
    set({ ...EMPTY });
  },
};

export function useMe() {
  const s = useSyncExternalStore(
    subscribe,
    () => state,
    () => EMPTY,
  );
  useEffect(() => {
    if (state.status === "loading" && !state.user) void load();
  }, []);
  return {
    ...s,
    refresh: me.refresh,
    setBalance: me.setBalance,
    setUser: me.setUser,
  };
}

export function MeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    void load();
    // Coming back to the tab: the balance may have changed elsewhere (another tab, a payment).
    const onVisible = () => {
      if (document.visibilityState === "visible" && state.user) void load();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);
  return children;
}

/** "Al Imam Hossain" → "AH"; falls back to the last two phone digits. */
export function initialsOf(user: Pick<User, "name" | "phone" | "email">) {
  const words = user.name.trim().split(/\s+/).filter(Boolean);
  if (words.length)
    return (
      words[0][0] + (words.length > 1 ? words.at(-1)![0] : "")
    ).toUpperCase();
  if (user.email) return user.email[0].toUpperCase();
  return user.phone?.slice(-2) ?? "";
}

/** "+8801712345214" → "1712 345 214" (the national number, 4 · 3 · 3 as in Figma). */
export function nationalPhone(phone: string | null) {
  if (!phone) return "";
  const d = phone.replace(/^\+880/, "");
  return [d.slice(0, 4), d.slice(4, 7), d.slice(7)].filter(Boolean).join(" ");
}

/** What to call the user in a greeting: their preferred name, else the first word of their name. */
export function greetingName(user: Pick<User, "name" | "preferredName">) {
  return user.preferredName?.trim() || user.name.trim().split(/\s+/)[0] || "";
}

/** What to call the user when they haven't set a name. */
export function displayName(user: Pick<User, "name" | "phone" | "email">) {
  return (
    user.name.trim() ||
    user.email ||
    (user.phone ? `+880 ${nationalPhone(user.phone)}` : "")
  );
}
