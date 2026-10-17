"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Suspense, useEffect, useRef, type ReactNode } from "react";

import { Button } from "@/components/atoms/Button";
import { Icon } from "@/components/atoms/Icon";
import { PaymentLogoSlot } from "@/components/atoms/PaymentLogoSlot";
import { Skeleton } from "@/components/atoms/Skeleton";
import { cx, focusRing, stateLayer } from "@/components/atoms/states";
import { ChecklistCard } from "@/components/molecules/ChecklistCard";
import { EmptyState } from "@/components/molecules/EmptyState";
import { Field } from "@/components/molecules/Field";
import { HintCard } from "@/components/molecules/HintCard";
import { KeyValueCard } from "@/components/molecules/KeyValueCard";
import { PaymentHistoryCard } from "@/components/molecules/PaymentHistoryCard";
import { ResultHero } from "@/components/molecules/ResultHero";
import { StepList } from "@/components/molecules/StepList";
import { TileRow } from "@/components/molecules/TileRow";
import { MethodTiles } from "@/components/organisms/MethodTiles";
import { MobileBalanceCard } from "@/components/organisms/MobileBalanceCard";
import { MobilePackList } from "@/components/organisms/MobilePackList";
import { MobilePayBar } from "@/components/organisms/MobilePayBar";
import { MobileTopBar } from "@/components/organisms/MobileTopBar";
import { Link, useRouter } from "@/lib/i18n/navigation";
import { useMe } from "@/lib/me";
import {
  bonusPct,
  chatsFor,
  customProblem,
  history,
  MAX_CUSTOM_BDT,
  MIN_CUSTOM_BDT,
  PACKS,
  packQuote,
  PAYMENT_METHODS,
  PRO_PLAN,
  reference,
  selectionQuote,
  usePayment,
  useWallet,
  walletActions,
  type Payment,
} from "@/lib/payments/client";

import { useOverlay } from "../../../_shell/overlays";

import {
  downloadText,
  useIsDesktopKnown,
  usePaymentsCsv,
  useWalletFormat,
} from "./format";
import { useBalance, useStartTopUp } from "./pay";
import { usePendingPayment } from "./usePendingPayment";

// Below 768px the wallet is a set of M-screens, one route each (Figma: Prototype › 7 Mobile):
//   /wallet           M10 · Wallet
//   /wallet/top-up    M11 · Add credits: amount & bKash
//   /wallet/pay       M34 · Finish payment in bKash (?payment=<id>; the sandbox approves itself
//                     after a few seconds, a PayStation payment is re-checked until it settles)
//   /wallet/paid      M12 · Payment received (?payment=<id>)
//   /wallet/failed    M35 · Payment didn't go through  (?payment=<id>)
//   /wallet/payments  M36 · Payment history

/** Simulated bKash approval time on M34 (the prototype's AFTER_TIMEOUT). */
const APPROVE_AFTER_MS = 6000;

function Screen({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("flex min-h-dvh flex-col", className)}>{children}</div>
  );
}

function useCredits() {
  const tc = useTranslations("common");
  const f = useWalletFormat();
  return (v: number) => tc("credits", { amount: f.n(v) });
}

/** The payment named by ?payment= (read behind Suspense, as cacheComponents requires). */
function usePaymentParam() {
  const id = useSearchParams().get("payment");
  return { id, payment: usePayment(id) };
}

// ---------------------------------------------------------------------------
// M10 · Wallet

export function MobileWallet() {
  const t = useTranslations("wallet");
  const tc = useTranslations("common");
  const f = useWalletFormat();
  const credits = useCredits();
  const s = useWallet();
  const router = useRouter();
  const { openOverlay } = useOverlay();
  const { balance: known, plan } = useBalance(
    s.wallet?.balance.credits ?? null,
  );
  const balance = known ?? 0;
  // "About N chats" divides by the average spend per chat.
  const avg = s.wallet?.averageChatCredits ?? null;
  const spent = s.wallet?.spentThisMonth.credits ?? 0;
  const pro = (s.wallet?.plan ?? plan) === "pro";
  const last = history(s.payments)[0];

  return (
    <Screen className="pb-tab-bar-height">
      <MobileTopBar title={t("title")} />
      <div className="flex flex-col gap-m-content-gap px-mobile-gutter pt-2 pb-4">
        <MobileBalanceCard
          label={t("mobile.balance")}
          value={known === null ? tc("loading") : credits(balance)}
          caption={t("mobile.balanceCaption", {
            bdt: f.taka(balance),
            chats: f.n(chatsFor(balance, avg)),
          })}
          chip={t("stats.neverExpire")}
          action={{
            label: t("mobile.addCredits"),
            onClick: () => router.push("/wallet/top-up"),
          }}
        />
        <HintCard title={t("mobile.howTitle")} body={t("mobile.howBody")} />
        <TileRow
          icon="chart-histogram"
          title={t("mobile.spent")}
          caption={t("mobile.spentValue", {
            credits: f.n(spent),
            bdt: f.taka(spent),
          })}
          link={<Link href="/settings/usage" />}
        />
        <TileRow
          icon="clock-01"
          title={t("mobile.history")}
          caption={
            last
              ? t("mobile.historyLast", {
                  amount: f.n(last.bdt),
                  method: f.method(last.method),
                  status:
                    last.status === "paid"
                      ? t("mobile.lastAdded")
                      : t("mobile.lastNotCharged"),
                })
              : t("mobile.historyEmpty")
          }
          link={<Link href="/wallet/payments" />}
        />
        {pro ? (
          <TileRow
            icon="crown"
            title={t("mobile.pro")}
            caption={t("mobile.proCaption", {
              bdt: f.n(PRO_PLAN.bdt),
              date: s.wallet?.proRenewsAt ? f.date(s.wallet.proRenewsAt) : "",
            })}
          />
        ) : (
          <TileRow
            icon="crown"
            title={t("mobile.payg")}
            caption={t("mobile.paygCaption", { bdt: f.n(PRO_PLAN.bdt) })}
            action={{
              label: t("mobile.upgrade"),
              onClick: () => openOverlay("go-pro"),
            }}
          />
        )}
      </div>
    </Screen>
  );
}

// ---------------------------------------------------------------------------
// M11 · Add credits: amount & bKash

export function MobileTopUp() {
  const t = useTranslations("wallet");
  const to = useTranslations("wallet.order");
  const f = useWalletFormat();
  const credits = useCredits();
  const s = useWallet();
  const topUp = useStartTopUp();
  const { balance } = useBalance(s.wallet?.balance.credits ?? null);
  const q = selectionQuote(s.selection);
  const custom = s.selection.pack === "custom";
  const problem = customProblem(s.selection);

  return (
    <Screen>
      <MobileTopBar
        title={t("mobile.topUpTitle")}
        back={{ label: t("title"), link: <Link href="/wallet" /> }}
      />
      <div className="flex flex-1 flex-col gap-m-content-gap-sm px-mobile-gutter pt-2 pb-6">
        <h2 className="type-m-step-title text-ink-2">{t("mobile.step1")}</h2>
        <MobilePackList
          label={t("mobile.step1")}
          value={custom ? "" : s.selection.pack}
          onValueChange={walletActions.selectPack}
          packs={PACKS.map((p) => {
            const pq = packQuote(p.id);
            return {
              value: p.id,
              price: t("mobile.price", { amount: f.n(p.bdt) }),
              credits: credits(pq.credits),
              bonus: p.bonusPercent
                ? t("mobile.bonus", { pct: f.n(p.bonusPercent) })
                : undefined,
              tag: p.mostChosen ? t("topUp.mostChosen") : undefined,
            };
          })}
        />
        <button
          type="button"
          onClick={() => walletActions.setCustom(s.selection.customBdt)}
          aria-expanded={custom}
          className={cx(
            "flex min-h-12 items-center self-start rounded-xs type-m-row-title text-blue",
            focusRing,
          )}
        >
          {t("mobile.other", { min: f.n(MIN_CUSTOM_BDT) })}
        </button>
        {custom && (
          <Field
            autoFocus
            label={t("topUp.customLabel")}
            type="number"
            inputMode="numeric"
            min={MIN_CUSTOM_BDT}
            max={MAX_CUSTOM_BDT}
            value={s.selection.customBdt ?? ""}
            onChange={(e) =>
              walletActions.setCustom(
                e.target.value === ""
                  ? null
                  : Math.floor(Number(e.target.value)),
              )
            }
            help={t("topUp.customHelp", { min: f.n(MIN_CUSTOM_BDT) })}
            error={
              problem === "too_low"
                ? t("topUp.customError", { min: f.n(MIN_CUSTOM_BDT) })
                : problem === "too_high"
                  ? t("topUp.customMaxError", { max: f.n(MAX_CUSTOM_BDT) })
                  : undefined
            }
          />
        )}
        <h2 className="pt-0-5 type-m-step-title text-ink-2">
          {t("mobile.step2")}
        </h2>
        <MethodTiles
          label={t("mobile.step2")}
          methods={PAYMENT_METHODS.map((m) => ({
            value: m,
            name: f.method(m),
          }))}
          value={s.selection.method}
          onValueChange={walletActions.selectMethod}
        />
        {topUp.failed && (
          <p role="alert" className="type-ui text-error">
            {t("order.startFailed")}
          </p>
        )}
      </div>
      <MobilePayBar
        className="sticky bottom-0"
        summary={
          q
            ? t("mobile.youGet", { credits: f.n(q.credits) })
            : to("chooseAmount")
        }
        detail={
          q && balance !== null
            ? t("mobile.newBalance", { credits: f.n(balance + q.credits) })
            : undefined
        }
        payLabel={
          q
            ? t("mobile.pay", {
                amount: f.n(q.bdt),
                method: f.method(s.selection.method),
              })
            : to("chooseAmount")
        }
        disabled={!q || topUp.busy || balance === null}
        onPay={() => void topUp.start()}
        note={t("mobile.secure")}
      />
    </Screen>
  );
}

// ---------------------------------------------------------------------------
// M34 · Finish payment in bKash

export function MobilePay() {
  return (
    <Suspense>
      <MobilePayScreen />
    </Suspense>
  );
}

function MobilePayScreen() {
  const t = useTranslations("checkout.mobile");
  const f = useWalletFormat();
  const s = useWallet();
  const router = useRouter();
  // null until known: a wide window shows the desktop dialog instead (WalletDialogs).
  const desktop = useIsDesktopKnown() !== false;
  const topUp = useStartTopUp();
  const { id, payment } = usePaymentParam();
  const fallback = selectionQuote(s.selection);
  const bdt = payment?.bdt ?? fallback?.bdt ?? 0;
  const method = payment?.method ?? s.selection.method;
  const name = f.method(method);

  // Opened from a link with no payment: start one for the current selection.
  const started = useRef(false);
  useEffect(() => {
    if (desktop || id || started.current) return;
    started.current = true;
    void topUp.start("replace");
  }, [desktop, id, topUp]);

  const show = (p: Payment) =>
    router.replace(
      `${p.status === "paid" ? "/wallet/paid" : "/wallet/failed"}?payment=${p.id}`,
    );
  const pending = usePendingPayment(desktop ? null : payment, show);
  const sandbox = pending?.provider === "sandbox";

  // Sandbox decisions; the result screen follows from usePendingPayment.
  const deciding = useRef(false);
  const decide = async (outcome: "paid" | "failed" | "cancelled") => {
    if (!pending || deciding.current) return;
    deciding.current = true;
    try {
      await walletActions.decide(pending.id, outcome);
    } finally {
      deciding.current = false;
    }
  };
  const approve = () => {
    if (!pending) return;
    if (sandbox) void decide("paid");
    else void walletActions.get(pending.id).catch(() => {});
  };
  const cancel = () => {
    if (sandbox) void decide("cancelled");
    else router.push("/wallet/top-up");
  };

  // The bKash app answers by itself after a while (the prototype's AFTER_TIMEOUT → M12).
  const approveRef = useRef(approve);
  useEffect(() => {
    approveRef.current = approve;
  });
  const autoApprove = !desktop && sandbox;
  useEffect(() => {
    if (!autoApprove) return;
    const timer = window.setTimeout(
      () => approveRef.current(),
      APPROVE_AFTER_MS,
    );
    return () => window.clearTimeout(timer);
  }, [autoApprove]);

  return (
    <Screen>
      <MobileTopBar
        title={t("paying", { amount: f.n(bdt) })}
        back={{
          label: t("cancel"),
          icon: "cancel-01",
          link: (
            <Link
              href="/wallet/top-up"
              onClick={() => {
                if (sandbox && pending)
                  void walletActions.decide(pending.id, "cancelled");
              }}
            />
          ),
        }}
      />
      <div className="flex flex-col items-center gap-go-pro-gap px-mobile-gutter pt-6 text-center">
        {method === "card" ? (
          <span className="flex size-m-logo items-center justify-center rounded-lg bg-blue-soft text-blue">
            <Icon name="credit-card" className="size-10" />
          </span>
        ) : (
          <PaymentLogoSlot
            method={method}
            label=""
            sizeClassName="size-m-logo"
            className="rounded-lg"
          />
        )}
        <h2 className="type-heading text-ink">
          {t("finishTitle", { method: name })}
        </h2>
        <p className="px-2 type-body text-ink-2">
          {t("finishBody", { kind: method, method: name })}
        </p>
        <StepList
          className="w-full text-left"
          numbers={[1, 2, 3].map(f.n)}
          steps={[
            { label: t("stepOpened", { method: name }), done: true },
            { label: t("stepPin", { kind: method, method: name }) },
            { label: t("stepAdded") },
          ]}
        />
      </div>
      <span className="flex-1" />
      <div className="flex flex-col items-center gap-m-content-gap-sm px-mobile-gutter pt-8 pb-6">
        {topUp.failed && (
          <p role="alert" className="text-center type-ui text-error">
            {t("startFailed")}
          </p>
        )}
        <Button
          size="touch-lg"
          className="w-full"
          onClick={approve}
          disabled={!pending}
        >
          {t("openAgain", { method: name })}
        </Button>
        <button
          type="button"
          onClick={cancel}
          className={cx(
            "flex h-12 w-full items-center justify-center rounded-pill type-m-button text-ink",
            stateLayer,
            focusRing,
          )}
        >
          {t("cancelPayment")}
        </button>
        <p className="text-center type-ui text-ink-2">
          {t("nothingCharged", { method: name })}
        </p>
      </div>
    </Screen>
  );
}

// ---------------------------------------------------------------------------
// M12 · Payment received

export function MobilePaid() {
  return (
    <Suspense>
      <MobilePaidScreen />
    </Suspense>
  );
}

function MobilePaidScreen() {
  const t = useTranslations("checkout");
  const tc = useTranslations("common");
  const f = useWalletFormat();
  const credits = useCredits();
  const s = useWallet();
  const router = useRouter();
  const { openOverlay } = useOverlay();
  const { balance } = useMe();
  const { payment } = usePaymentParam();
  const mobile = useIsDesktopKnown() === false;

  // Pro paid through PayStation lands here: show "Pro is on".
  const isPro = payment?.kind === "pro" && payment.status === "paid";
  useEffect(() => {
    if (isPro && mobile) {
      openOverlay("pro-on");
      router.replace("/wallet");
    }
  }, [isPro, mobile, openOverlay, router]);

  const last =
    payment?.status === "paid"
      ? payment
      : history(s.payments).find((p) => p.status === "paid");
  const fallback = selectionQuote(s.selection);
  const paid = last
    ? {
        bdt: last.bdt,
        method: last.method,
        credits: last.credits,
        bonus: last.bonusCredits,
        bonusPct: bonusPct(last),
        reference: reference(last),
        at: last.createdAt,
      }
    : {
        bdt: fallback?.bdt ?? 0,
        method: s.selection.method,
        credits: fallback?.credits ?? 0,
        bonus: fallback?.bonus ?? 0,
        bonusPct: fallback?.bonusPct ?? 0,
        reference: undefined,
        at: undefined,
      };

  const details = [
    {
      label: t("mobile.youPaid"),
      value: t("mobile.youPaidValue", {
        amount: f.n(paid.bdt),
        method: f.method(paid.method),
      }),
    },
    {
      label: t("mobile.bonus"),
      value: paid.bonus
        ? t("mobile.bonusValue", {
            credits: f.n(paid.bonus),
            pct: f.n(paid.bonusPct),
          })
        : t("mobile.noBonus"),
    },
  ];
  if (paid.reference)
    details.push({ label: t("mobile.transactionId"), value: paid.reference });
  if (paid.at)
    details.push({
      label: t("mobile.date"),
      value: t("mobile.dateValue", {
        date: f.date(paid.at),
        time: f.time(paid.at),
      }),
    });

  return (
    <Screen className="px-mobile-gutter">
      <ResultHero
        className="pt-16"
        tone="success"
        title={t("received.title")}
        body={t("mobile.receivedBody", { credits: f.n(paid.credits) })}
      />
      <KeyValueCard
        className="mt-6"
        sections={[
          [
            {
              label: t("mobile.newBalance"),
              value: balance ? credits(balance.credits) : tc("loading"),
              strong: true,
            },
            {
              label: t("mobile.inTaka"),
              value: t("mobile.inTakaValue", {
                amount: f.taka(balance?.credits ?? 0),
              }),
            },
          ],
          details,
        ]}
      />
      <span className="flex-1" />
      <div className="flex flex-col gap-m-content-gap-sm pt-8 pb-6">
        <Button
          size="touch-lg"
          className="w-full"
          onClick={() => router.push("/")}
        >
          {t("mobile.startAsking")}
        </Button>
        <Button
          variant="secondary"
          size="touch"
          icon="arrow-down-01"
          iconSize="lg"
          className="w-full"
          onClick={() => router.push("/wallet/payments")}
        >
          {t("mobile.downloadReceipt")}
        </Button>
      </div>
    </Screen>
  );
}

// ---------------------------------------------------------------------------
// M35 · Payment didn't go through

export function MobileFailed() {
  return (
    <Suspense>
      <MobileFailedScreen />
    </Suspense>
  );
}

function MobileFailedScreen() {
  const t = useTranslations("checkout");
  const f = useWalletFormat();
  const s = useWallet();
  const router = useRouter();
  const topUp = useStartTopUp();
  const { payment } = usePaymentParam();
  const last =
    payment && payment.status !== "paid"
      ? payment
      : history(s.payments).find((p) => p.status !== "paid");
  const method = last?.method ?? s.selection.method;
  const name = f.method(method);

  const retry = () => {
    if (last) walletActions.repeat(last);
    void topUp.start();
  };

  return (
    <Screen className="px-mobile-gutter">
      <ResultHero
        className="pt-16"
        tone="error"
        title={t("failed.title")}
        body={t("mobile.failedBody", { method: name })}
      />
      <ChecklistCard
        className="mt-3"
        title={t("mobile.reasons")}
        items={[
          t("mobile.reasonPin", { kind: method }),
          t("mobile.reasonBalance", { kind: method, method: name }),
          t("mobile.reasonClosed", { kind: method, method: name }),
        ]}
      />
      <span className="flex-1" />
      <div className="flex flex-col items-center gap-m-content-gap-sm pt-8 pb-6">
        <Button
          size="touch-lg"
          icon="reload"
          iconSize="lg"
          className="w-full"
          onClick={retry}
          disabled={topUp.busy}
        >
          {t("mobile.tryAgain")}
        </Button>
        <Button
          variant="secondary"
          size="touch"
          className="w-full"
          onClick={() => router.push("/wallet/top-up")}
        >
          {t("mobile.payAnotherWay")}
        </Button>
        <Link
          href="/settings/help"
          className={cx(
            "flex min-h-12 items-center gap-1-5 rounded-xs type-m-row-title text-blue",
            focusRing,
          )}
        >
          <Icon name="help-circle" className="size-icon-sm" />
          {t("mobile.help")}
        </Link>
      </div>
    </Screen>
  );
}

// ---------------------------------------------------------------------------
// M36 · Payment history

export function MobilePayments() {
  const t = useTranslations("wallet");
  const tc = useTranslations("common");
  const f = useWalletFormat();
  const s = useWallet();
  const router = useRouter();
  const csv = usePaymentsCsv();
  const header = [
    t("payments.csv.date"),
    t("payments.csv.amount"),
    t("payments.csv.method"),
    t("payments.csv.status"),
    t("payments.csv.credits"),
    t("payments.csv.reference"),
  ];

  return (
    <Screen>
      <MobileTopBar
        title={t("mobile.historyTitle")}
        back={{ label: t("title"), link: <Link href="/wallet" /> }}
      />
      <div className="flex flex-col gap-m-content-gap-sm px-mobile-gutter pt-2 pb-6">
        {/* Loading, error and empty: the desktop row 10 states, at phone width (no M-screen yet). */}
        {!s.payments && s.status !== "error" && (
          <div
            role="status"
            aria-label={tc("loading")}
            className="flex flex-col gap-m-content-gap-sm"
          >
            {Array.from({ length: 3 }, (_, i) => (
              <Skeleton
                key={i}
                className="rounded-lg border border-line bg-surface p-4"
              />
            ))}
          </div>
        )}
        {!s.payments && s.status === "error" && (
          <EmptyState
            tone="error"
            title={t("payments.loadError")}
            body={t("payments.loadErrorBody")}
            action={
              <Button
                variant="secondary"
                size="sm"
                onClick={() => void walletActions.refresh()}
              >
                {tc("tryAgain")}
              </Button>
            }
          />
        )}
        {s.payments && history(s.payments).length === 0 && (
          <EmptyState
            icon="wallet-01"
            title={t("payments.empty.title")}
            body={t("payments.empty.body")}
          />
        )}
        {history(s.payments).map((p) => {
          const ok = p.status === "paid";
          const time = f.time(p.createdAt);
          return (
            <PaymentHistoryCard
              key={p.id}
              amount={t(
                p.kind === "pro" ? "mobile.proAmount" : "mobile.amount",
                {
                  amount: f.n(p.bdt),
                  method: f.method(p.method),
                },
              )}
              status={
                ok
                  ? { label: t("mobile.statusAdded"), tone: "success" }
                  : { label: t("mobile.statusNotCharged"), tone: "error" }
              }
              date={
                f.isToday(p.createdAt)
                  ? t("mobile.today", { time })
                  : t("mobile.dateTime", { date: f.date(p.createdAt), time })
              }
              action={
                ok
                  ? {
                      icon: "arrow-down-01",
                      label: t("mobile.downloadReceipt"),
                      onClick: () =>
                        downloadText(
                          t("payments.csv.receiptFile", {
                            reference: reference(p),
                          }),
                          csv([p], header),
                        ),
                    }
                  : {
                      icon: "reload",
                      label: t("mobile.tryAgain"),
                      onClick: () => {
                        walletActions.repeat(p);
                        router.push("/wallet/top-up");
                      },
                    }
              }
            />
          );
        })}
        {history(s.payments).length > 0 && (
          <p className="type-ui text-ink-2">{t("mobile.historyNote")}</p>
        )}
      </div>
    </Screen>
  );
}
