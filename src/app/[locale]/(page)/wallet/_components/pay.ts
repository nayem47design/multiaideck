"use client";

import { useState } from "react";

import { useRouter } from "@/lib/i18n/navigation";
import { useMe } from "@/lib/me";
import { walletActions, type Selection } from "@/lib/payments/client";

/** Send the browser where the server said: the in-app sandbox checkout, or PayStation's page. */
export function useGo() {
  const router = useRouter();
  return (redirectUrl: string, how: "push" | "replace" = "push") => {
    if (redirectUrl.startsWith("/"))
      router[how](redirectUrl, { scroll: false });
    else window.location.assign(redirectUrl);
  };
}

/** Start a top-up for the current selection (POST /api/payments) and go to its checkout. */
export function useStartTopUp() {
  const go = useGo();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const start = async (how: "push" | "replace" = "push") => {
    if (busy) return;
    setBusy(true);
    setFailed(false);
    try {
      const { redirectUrl } = await walletActions.start({ kind: "topup" });
      go(redirectUrl, how);
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };
  return { start, busy, failed };
}

/** Balance and plan for the wallet screens: the user's balance (shared with the sidebar). */
export function useBalance(fallback: number | null) {
  const { balance, user } = useMe();
  return {
    balance: balance?.credits ?? fallback,
    plan: user?.plan,
  };
}

export type { Selection };
