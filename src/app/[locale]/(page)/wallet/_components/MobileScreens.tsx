"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, type ReactNode } from "react";

import { Button } from "@/components/atoms/Button";
import { Icon } from "@/components/atoms/Icon";
import { cx, focusRing, stateLayer } from "@/components/atoms/states";
import { ChecklistCard } from "@/components/molecules/ChecklistCard";
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
import {
  balanceOf,
  chatsFor,
  DEMO_SPENT,
  lastPayment,
  MIN_CUSTOM_BDT,
  PACKS,
  PAYMENT_METHODS,
  paymentsNewestFirst,
  PRO_PLAN,
  quote,
  selectionQuote,
  useWallet,
  wallet,
  type Payment,
} from "@/lib/mock/wallet";

import { useOverlay } from "../../../_shell/overlays";

import {
  downloadText,
  useIsDesktop,
  usePaymentsCsv,
  useWalletFormat,
} from "./format";

// Below 768px the wallet is a set of M-screens, one route each (Figma: Prototype › 7 Mobile):
//   /wallet           M10 · Wallet
//   /wallet/top-up    M11 · Add credits: amount & bKash
//   /wallet/pay       M34 · Finish payment in bKash (approves itself after a few seconds)
//   /wallet/paid      M12 · Payment received
//   /wallet/failed    M35 · Payment didn't go through
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

// ---------------------------------------------------------------------------
// M10 · Wallet

export function MobileWallet() {
  const t = useTranslations("wallet");
  const f = useWalletFormat();
  const credits = useCredits();
  const s = useWallet();
  const router = useRouter();
  const { openOverlay } = useOverlay();
  const balance = balanceOf(s);
  const last = paymentsNewestFirst(s)[0];

  return (
    <Screen className="pb-tab-bar-height">
      <MobileTopBar title={t("title")} />
      <div className="flex flex-col gap-m-content-gap px-mobile-gutter pt-2 pb-4">
        <MobileBalanceCard
          label={t("mobile.balance")}
          value={credits(balance)}
          caption={t("mobile.balanceCaption", {
            bdt: f.taka(balance),
            chats: f.n(chatsFor(balance)),
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
            credits: f.n(DEMO_SPENT.credits),
            bdt: f.taka(DEMO_SPENT.credits),
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
                    last.status === "succeeded"
                      ? t("mobile.lastAdded")
                      : t("mobile.lastNotCharged"),
                })
              : t("mobile.historyEmpty")
          }
          link={<Link href="/wallet/payments" />}
        />
        {s.pro ? (
          <TileRow
            icon="crown"
            title={t("mobile.pro")}
            caption={t("mobile.proCaption", {
              bdt: f.n(PRO_PLAN.bdt),
              date: f.date(PRO_PLAN.renews),
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
  const router = useRouter();
  const q = selectionQuote(s.selection);
  const custom = s.selection.pack === "custom";
  const tooLow =
    custom &&
    s.selection.customBdt !== null &&
    s.selection.customBdt < MIN_CUSTOM_BDT;

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
          onValueChange={wallet.selectPack}
          packs={PACKS.map((p) => {
            const pq = quote(p.bdt, p.bonusPct);
            return {
              value: p.id,
              price: t("mobile.price", { amount: f.n(p.bdt) }),
              credits: credits(pq.credits),
              bonus: p.bonusPct
                ? t("mobile.bonus", { pct: f.n(p.bonusPct) })
                : undefined,
              tag: p.popular ? t("topUp.mostChosen") : undefined,
            };
          })}
        />
        <button
          type="button"
          onClick={() => wallet.setCustom(s.selection.customBdt)}
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
            value={s.selection.customBdt ?? ""}
            onChange={(e) =>
              wallet.setCustom(
                e.target.value === ""
                  ? null
                  : Math.floor(Number(e.target.value)),
              )
            }
            help={t("topUp.customHelp", { min: f.n(MIN_CUSTOM_BDT) })}
            error={
              tooLow
                ? t("topUp.customError", { min: f.n(MIN_CUSTOM_BDT) })
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
          onValueChange={wallet.selectMethod}
        />
      </div>
      <MobilePayBar
        className="sticky bottom-0"
        summary={
          q
            ? t("mobile.youGet", { credits: f.n(q.credits) })
            : to("chooseAmount")
        }
        detail={
          q
            ? t("mobile.newBalance", { credits: f.n(balanceOf(s) + q.credits) })
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
        disabled={!q}
        onPay={() => {
          if (wallet.startCheckout()) router.push("/wallet/pay");
        }}
        note={t("mobile.secure")}
      />
    </Screen>
  );
}

// ---------------------------------------------------------------------------
// M34 · Finish payment in bKash

export function MobilePay() {
  const t = useTranslations("checkout.mobile");
  const f = useWalletFormat();
  const s = useWallet();
  const router = useRouter();
  const desktop = useIsDesktop();
  const q = s.pending?.quote ?? selectionQuote(s.selection);
  const method = s.pending?.method ?? s.selection.method;
  const name = f.method(method);

  // Opened from a link with nothing pending: send the request for the current selection.
  const settled = useRef(false);
  useEffect(() => {
    if (!desktop && !settled.current) wallet.ensureCheckout();
  }, [desktop]);

  const settle = (status: "succeeded" | "failed") => {
    if (settled.current || !wallet.settle(status)) return;
    settled.current = true;
    router.replace(status === "succeeded" ? "/wallet/paid" : "/wallet/failed");
  };
  const approve = () => settle("succeeded");
  const fail = () => settle("failed");

  // The bKash app answers by itself after a while (the prototype's AFTER_TIMEOUT → M12).
  const approveRef = useRef(approve);
  useEffect(() => {
    approveRef.current = approve;
  });
  useEffect(() => {
    if (desktop) return;
    const timer = window.setTimeout(
      () => approveRef.current(),
      APPROVE_AFTER_MS,
    );
    return () => window.clearTimeout(timer);
  }, [desktop]);

  return (
    <Screen>
      <MobileTopBar
        title={t("paying", { amount: f.n(q?.bdt ?? 0) })}
        back={{
          label: t("cancel"),
          icon: "cancel-01",
          link: <Link href="/wallet/top-up" onClick={wallet.cancelCheckout} />,
        }}
      />
      <div className="flex flex-col items-center gap-go-pro-gap px-mobile-gutter pt-6 text-center">
        <span className="flex size-m-logo items-center justify-center rounded-lg bg-blue-soft text-blue">
          <Icon
            name={method === "card" ? "credit-card" : "smart-phone-01"}
            className="size-10"
          />
        </span>
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
        <Button size="touch-lg" className="w-full" onClick={approve}>
          {t("openAgain", { method: name })}
        </Button>
        <button
          type="button"
          onClick={fail}
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
  const t = useTranslations("checkout");
  const f = useWalletFormat();
  const credits = useCredits();
  const s = useWallet();
  const router = useRouter();
  const balance = balanceOf(s);
  const last = lastPayment(s);
  const fallback = selectionQuote(s.selection);
  const paid: Pick<
    Payment,
    "bdt" | "method" | "credits" | "bonus" | "bonusPct"
  > & {
    reference?: string;
    at?: string;
  } =
    last?.status === "succeeded"
      ? last
      : {
          bdt: fallback?.bdt ?? 0,
          method: s.selection.method,
          credits: fallback?.credits ?? 0,
          bonus: fallback?.bonus ?? 0,
          bonusPct: fallback?.bonusPct ?? 0,
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
              value: credits(balance),
              strong: true,
            },
            {
              label: t("mobile.inTaka"),
              value: t("mobile.inTakaValue", { amount: f.taka(balance) }),
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
  const t = useTranslations("checkout");
  const f = useWalletFormat();
  const s = useWallet();
  const router = useRouter();
  const last = lastPayment(s);
  const method = last?.status === "failed" ? last.method : s.selection.method;
  const name = f.method(method);

  const retry = () => {
    if (last) wallet.repeat(last);
    if (wallet.startCheckout()) router.push("/wallet/pay");
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
        {paymentsNewestFirst(s).map((p) => {
          const ok = p.status === "succeeded";
          const time = f.time(p.at);
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
                f.isToday(p.at)
                  ? t("mobile.today", { time })
                  : t("mobile.dateTime", { date: f.date(p.at), time })
              }
              action={
                ok
                  ? {
                      icon: "arrow-down-01",
                      label: t("mobile.downloadReceipt"),
                      onClick: () =>
                        downloadText(
                          t("payments.csv.receiptFile", {
                            reference: p.reference,
                          }),
                          csv([p], header),
                        ),
                    }
                  : {
                      icon: "reload",
                      label: t("mobile.tryAgain"),
                      onClick: () => {
                        wallet.repeat(p);
                        router.push("/wallet/top-up");
                      },
                    }
              }
            />
          );
        })}
        <p className="type-ui text-ink-2">{t("mobile.historyNote")}</p>
      </div>
    </Screen>
  );
}
