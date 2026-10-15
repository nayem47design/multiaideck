"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";

import { CheckoutDialogPanel } from "@/components/organisms/CheckoutDialog";
import { PaymentResultDialogPanel } from "@/components/organisms/PaymentResultDialog";
import { ModalOverApp } from "@/components/templates/ModalOverApp";
import { usePathname, useRouter } from "@/lib/i18n/navigation";
import {
  balanceOf,
  lastPayment,
  selectionQuote,
  useWallet,
  wallet,
} from "@/lib/mock/wallet";

import { useIsDesktop, useWalletFormat } from "./format";

// Figma: Overlay · Checkout (simulated) 28:11535, Overlay · Payment received 28:11563 and
// Overlay · Payment failed 28:11583, over the desktop wallet. Prototype taps: approved → received,
// simulate failure → failed, failed "Try again" → checkout, others close.

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
  const router = useRouter();
  const pathname = usePathname();
  const desktop = useIsDesktop();
  const dialog = desktop
    ? DIALOGS[pathname as keyof typeof DIALOGS]
    : undefined;

  const close = () => router.replace("/wallet", { scroll: false });
  const credits = (v: number) => tc("credits", { amount: f.n(v) });

  // What is being paid: the pending checkout, else the current selection (a direct link).
  const pendingQuote = s.pending?.quote ?? selectionQuote(s.selection);
  const pendingMethod = s.pending?.method ?? s.selection.method;
  const last = lastPayment(s);

  // Opened from a link with nothing pending: send the request for the current selection. Not
  // right after settling, while the route is still /wallet/pay.
  const settled = useRef(false);
  useEffect(() => {
    if (dialog !== "checkout") settled.current = false;
    else if (!s.pending && !settled.current) wallet.ensureCheckout();
  }, [dialog, s.pending]);

  const settle = (status: "succeeded" | "failed") => {
    if (!wallet.settle(status)) return;
    settled.current = true;
    router.replace(status === "succeeded" ? "/wallet/paid" : "/wallet/failed", {
      scroll: false,
    });
  };
  const retry = () => {
    if (last) wallet.repeat(last);
    if (wallet.startCheckout())
      router.replace("/wallet/pay", { scroll: false });
  };

  const received =
    last?.status === "succeeded"
      ? { bdt: last.bdt, method: last.method, credits: last.credits }
      : pendingQuote
        ? {
            bdt: pendingQuote.bdt,
            method: pendingMethod,
            credits: pendingQuote.credits,
          }
        : null;
  const failedMethod = last?.status === "failed" ? last.method : pendingMethod;

  return (
    <>
      <ModalOverApp
        open={dialog === "checkout" && !!pendingQuote}
        onOpenChange={(open) => {
          if (!open) {
            wallet.cancelCheckout();
            close();
          }
        }}
        label={t("dialog.title", {
          kind: pendingMethod,
          method: f.method(pendingMethod),
        })}
      >
        {pendingQuote && (
          <CheckoutDialogPanel
            head={t("dialog.head")}
            title={t("dialog.title", {
              kind: pendingMethod,
              method: f.method(pendingMethod),
            })}
            body={t("dialog.body", {
              kind: pendingMethod,
              method: f.method(pendingMethod),
            })}
            summary={[
              {
                label: t("dialog.amount"),
                value: t("dialog.amountValue", {
                  amount: f.n(pendingQuote.bdt),
                }),
              },
              {
                label: t("dialog.youGet"),
                value: credits(pendingQuote.credits),
              },
              {
                label: t("dialog.method"),
                value: f.method(pendingMethod),
                text: true,
              },
            ]}
            approvedLabel={t("dialog.approved")}
            simulateFailureLabel={t("dialog.simulateFailure")}
            cancelLabel={t("dialog.cancel")}
            onApproved={() => settle("succeeded")}
            onSimulateFailure={() => settle("failed")}
            onCancel={() => {
              wallet.cancelCheckout();
              close();
            }}
          />
        )}
      </ModalOverApp>

      <ModalOverApp
        open={dialog === "received" && !!received}
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
              { label: t("received.newBalance"), value: credits(balanceOf(s)) },
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
