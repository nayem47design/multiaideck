"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

import { CheckoutDialogPanel } from "@/components/organisms/CheckoutDialog";
import { PaymentResultDialogPanel } from "@/components/organisms/PaymentResultDialog";
import { ModalOverApp } from "@/components/templates/ModalOverApp";
import { usePathname, useRouter } from "@/lib/i18n/navigation";
import { useMe } from "@/lib/me";
import {
  history,
  selectionQuote,
  usePayment,
  useWallet,
  walletActions,
  type Payment,
} from "@/lib/payments/client";

import { useOverlay } from "../../../_shell/overlays";

import { useIsDesktopKnown, useWalletFormat } from "./format";
import { useStartTopUp } from "./pay";
import { usePendingPayment } from "./usePendingPayment";

// Figma: Overlay · Checkout (simulated) 28:11535, Overlay · Payment received 28:11563 and
// Overlay · Payment failed 28:11583, over the desktop wallet. Prototype taps: approved → received,
// simulate failure → failed, failed "Try again" → checkout, others close.
//
// The routes carry the payment: /wallet/pay?payment=<id> is the checkout for a pending payment (the
// sandbox decides it here; a PayStation payment is re-checked until it settles), and
// /wallet/paid?payment= and /wallet/failed?payment= show its result.

const DIALOGS = {
  "/wallet/pay": "checkout",
  "/wallet/paid": "received",
  "/wallet/failed": "failed",
} as const;

export function WalletDialogs() {
  const t = useTranslations("checkout");
  const tc = useTranslations("common");
  const f = useWalletFormat();
  const s = useWallet();
  const { balance } = useMe();
  const router = useRouter();
  const pathname = usePathname();
  const desktop = useIsDesktopKnown() === true;
  const { openOverlay } = useOverlay();
  const id = useSearchParams().get("payment");
  const payment = usePayment(id);
  const topUp = useStartTopUp();
  const [busy, setBusy] = useState(false);
  const dialog = desktop
    ? DIALOGS[pathname as keyof typeof DIALOGS]
    : undefined;

  const close = () => router.replace("/wallet", { scroll: false });
  const credits = (v: number) => tc("credits", { amount: f.n(v) });
  const show = (p: Payment) =>
    router.replace(
      `${p.status === "paid" ? "/wallet/paid" : "/wallet/failed"}?payment=${p.id}`,
      { scroll: false },
    );

  // Opened from a link with no payment: start one for the current selection.
  const started = useRef(false);
  useEffect(() => {
    if (dialog !== "checkout") started.current = false;
    else if (!id && !started.current) {
      started.current = true;
      void topUp.start("replace");
    }
  }, [dialog, id, topUp]);

  // A payment that finished elsewhere (PayStation, a reload, the back button) shows its result.
  // Decisions made in this dialog navigate themselves.
  const decided = useRef<string | null>(null);
  const pending = usePendingPayment(
    dialog === "checkout" ? payment : null,
    (p) => {
      if (decided.current !== p.id) show(p);
    },
  );

  // Pro paid through PayStation comes back here: show "Pro is on" over the wallet.
  useEffect(() => {
    if (
      dialog === "received" &&
      payment?.kind === "pro" &&
      payment.status === "paid"
    ) {
      close();
      openOverlay("pro-on");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dialog, payment?.kind, payment?.status]);

  const decide = async (outcome: "paid" | "failed" | "cancelled") => {
    if (!pending || busy) return;
    decided.current = pending.id;
    setBusy(true);
    try {
      const p = await walletActions.decide(pending.id, outcome);
      if (outcome === "cancelled") close();
      else show(p);
    } finally {
      setBusy(false);
    }
  };
  const recheck = async () => {
    if (!pending) return;
    const p = await walletActions.get(pending.id);
    if (p.status !== "pending") show(p);
  };
  const sandbox = pending?.provider === "sandbox";

  const paid =
    payment?.status === "paid"
      ? payment
      : history(s.payments).find(
          (p) => p.status === "paid" && p.kind === "topup",
        );
  const fallback = selectionQuote(s.selection);
  const received = paid
    ? { bdt: paid.bdt, method: paid.method, credits: paid.credits }
    : fallback
      ? {
          bdt: fallback.bdt,
          method: s.selection.method,
          credits: fallback.credits,
        }
      : null;
  const failedPayment =
    payment && payment.status !== "paid"
      ? payment
      : history(s.payments).find((p) => p.status !== "paid");
  const failedMethod = failedPayment?.method ?? s.selection.method;
  const retry = () => {
    if (failedPayment) walletActions.repeat(failedPayment);
    void topUp.start("replace");
  };

  const method = pending?.method ?? s.selection.method;

  return (
    <>
      <ModalOverApp
        open={dialog === "checkout" && !!pending}
        onOpenChange={(open) => {
          if (!open) {
            if (sandbox) void decide("cancelled");
            else close();
          }
        }}
        label={t("dialog.title", { kind: method, method: f.method(method) })}
      >
        {pending && (
          <CheckoutDialogPanel
            head={sandbox ? t("dialog.head") : t("dialog.headLive")}
            title={t("dialog.title", {
              kind: method,
              method: f.method(method),
            })}
            body={t("dialog.body", { kind: method, method: f.method(method) })}
            summary={[
              {
                label: t("dialog.amount"),
                value: t("dialog.amountValue", { amount: f.n(pending.bdt) }),
              },
              { label: t("dialog.youGet"), value: credits(pending.credits) },
              {
                label: t("dialog.method"),
                value: f.method(method),
                text: true,
              },
            ]}
            approvedLabel={t("dialog.approved")}
            simulateFailureLabel={
              sandbox ? t("dialog.simulateFailure") : undefined
            }
            cancelLabel={t("dialog.cancel")}
            onApproved={() => (sandbox ? void decide("paid") : void recheck())}
            onSimulateFailure={() => void decide("failed")}
            onCancel={() => (sandbox ? void decide("cancelled") : close())}
          />
        )}
      </ModalOverApp>

      <ModalOverApp
        open={dialog === "received" && !!received && payment?.kind !== "pro"}
        onOpenChange={(open) => !open && close()}
        label={t("received.title")}
      >
        {received && (
          <PaymentResultDialogPanel
            result="received"
            title={t("received.title")}
            body={t("received.body", { credits: f.n(received.credits) })}
            summary={[
              {
                label: t("received.paid"),
                value: t("received.paidValue", {
                  amount: f.n(received.bdt),
                  method: f.method(received.method),
                }),
                text: true,
              },
              { label: t("received.added"), value: credits(received.credits) },
              {
                label: t("received.newBalance"),
                value: balance ? credits(balance.credits) : tc("loading"),
              },
            ]}
            primaryLabel={t("received.backToChat")}
            secondaryLabel={t("received.viewReceipt")}
            onPrimary={() => router.push("/")}
            onSecondary={() => {
              close();
              document
                .getElementById("payments")
                ?.scrollIntoView({ block: "start" });
            }}
          />
        )}
      </ModalOverApp>

      <ModalOverApp
        open={dialog === "failed"}
        onOpenChange={(open) => !open && close()}
        label={t("failed.title")}
      >
        <PaymentResultDialogPanel
          result="failed"
          title={t("failed.title")}
          body={t("failed.body", { method: f.method(failedMethod) })}
          primaryLabel={t("failed.tryAgain")}
          secondaryLabel={t("failed.chooseAnother")}
          onPrimary={retry}
          onSecondary={close}
        />
      </ModalOverApp>
    </>
  );
}
