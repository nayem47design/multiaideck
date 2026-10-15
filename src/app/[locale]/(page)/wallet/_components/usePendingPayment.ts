"use client";

import { useEffect, useRef } from "react";

import { walletActions, type Payment } from "@/lib/payments/client";

/** How often the checkout re-checks a PayStation payment while it is pending. */
const POLL_MS = 3000;

/**
 * The checkout's payment while it is pending. A PayStation payment is re-checked on the server
 * every few seconds (GET /api/payments/:id verifies it with PayStation); once any payment has
 * finished, `onSettled` is called once (show the result screen).
 */
export function usePendingPayment(
  payment: Payment | null,
  onSettled: (p: Payment) => void,
) {
  const settledRef = useRef(onSettled);
  useEffect(() => {
    settledRef.current = onSettled;
  });

  const status = payment?.status;
  const id = payment?.id;
  const provider = payment?.provider;
  const reported = useRef<string | null>(null);
  useEffect(() => {
    if (!payment || status === "pending" || reported.current === id) return;
    reported.current = id ?? null;
    if (status === "paid") void walletActions.refresh();
    settledRef.current(payment);
  }, [payment, status, id]);

  useEffect(() => {
    if (!id || status !== "pending" || provider !== "paystation") return;
    const timer = window.setInterval(
      () => void walletActions.get(id).catch(() => {}),
      POLL_MS,
    );
    return () => window.clearInterval(timer);
  }, [id, status, provider]);

  return payment?.status === "pending" ? payment : null;
}
