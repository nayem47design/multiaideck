"use client";

import { useLocale, useTranslations } from "next-intl";
import { Suspense, useEffect } from "react";

import { Field } from "@/components/molecules/Field";
import { Icon } from "@/components/atoms/Icon";
import { cx, focusRing } from "@/components/atoms/states";
import { CalloutLink } from "@/components/molecules/CalloutLink";
import { OrderSummary } from "@/components/organisms/OrderSummary";
import { PageTopBar } from "@/components/organisms/PageTopBar";
import { PaymentMethodSelector } from "@/components/organisms/PaymentMethodSelector";
import { PaymentsTable } from "@/components/organisms/PaymentsTable";
import { ProComparisonCard } from "@/components/organisms/ProComparisonCard";
import { StatSummaryRow } from "@/components/organisms/StatSummaryRow";
import { TopUpTable } from "@/components/organisms/TopUpTable";
import { getPathname, Link, usePathname } from "@/lib/i18n/navigation";
import {
  chatsFor,
  customProblem,
  DEFAULT_AVG_CREDITS,
  history,
  MAX_CUSTOM_BDT,
  MIN_CUSTOM_BDT,
  PACKS,
  packQuote,
  PAYMENT_METHODS,
  PRO_PLAN,
  reference,
  selectionQuote,
  useWallet,
  walletActions,
  type Payment,
} from "@/lib/payments/client";

import { useOverlay } from "../../../_shell/overlays";

import { downloadText, usePaymentsCsv, useWalletFormat } from "./format";
import { useBalance, useStartTopUp } from "./pay";
import { WalletDialogs } from "./WalletDialogs";

// Figma: Prototype › Wallet (28:9923), 1440×1808, and the checkout overlays over it. Shown from
// 768px; the dialogs follow the route (/wallet/pay, /wallet/paid, /wallet/failed), so the M-screen
// routes open the matching dialog on a wide window. Data: GET /api/wallet and /api/payments;
// paying starts a payment on the server (POST /api/payments) and follows its redirect.

/** Sub-routes that scroll the desktop wallet to a section. */
const SECTIONS: Record<string, string> = {
  "/wallet/top-up": "top-up",
  "/wallet/payments": "payments",
};

export function WalletDesktop({ className }: { className?: string }) {
  const t = useTranslations("wallet");
  const tc = useTranslations("common");
  const f = useWalletFormat();
  const s = useWallet();
  const pathname = usePathname();
  const locale = useLocale();
  const { openOverlay } = useOverlay();
  const csv = usePaymentsCsv();
  const topUp = useStartTopUp();

  const { balance: known, plan } = useBalance(
    s.wallet?.balance.credits ?? null,
  );
  const balance = known ?? 0;
  // "About N chats" divides by the average spend per chat.
  const avg = s.wallet?.averageChatCredits ?? null;
  const pro = (s.wallet?.plan ?? plan) === "pro";
  const spent = s.wallet?.spentThisMonth.credits ?? 0;
  const chats = s.wallet?.chatsThisMonth ?? 0;
  const q = selectionQuote(s.selection);
  const credits = (v: number) => tc("credits", { amount: f.n(v) });
  const loading = (v: string) => (known === null ? tc("loading") : v);
  const custom = s.selection.pack === "custom";
  const problem = customProblem(s.selection);
  const payments = history(s.payments);

  useEffect(() => {
    const id = SECTIONS[pathname];
    if (id) document.getElementById(id)?.scrollIntoView({ block: "start" });
  }, [pathname]);

  const pay = () => {
    if (q) void topUp.start();
  };
  const retry = (p: Payment) => {
    walletActions.repeat(p);
    void topUp.start();
  };
  const csvHeader = [
    t("payments.csv.date"),
    t("payments.csv.amount"),
    t("payments.csv.method"),
    t("payments.csv.status"),
    t("payments.csv.credits"),
    t("payments.csv.reference"),
  ];

  return (
    <div className={cx("px-shell-pad pt-shell-pad pb-16", className)}>
      <PageTopBar
        title={t("title")}
        back={{
          label: t("backToChat"),
          icon: "arrow-left-01",
          link: <Link href="/" />,
        }}
        action={{
          label: t("settings"),
          icon: "settings-01",
          link: <Link href="/settings/profile" />,
        }}
      />
      <main className="mx-auto mt-page-top flex w-full max-w-page-width flex-col">
        <h2 className="type-wallet-title text-ink">{t("title")}</h2>
        <p className="mt-2 type-wallet-lede text-ink-2">{t("lede")}</p>

        <StatSummaryRow
          className="mt-6 max-lg:flex-col"
          stats={[
            {
              label: t("stats.balance"),
              value: loading(credits(balance)),
              caption: t("stats.balanceCaption", {
                bdt: f.taka(balance),
                chats: f.n(chatsFor(balance, avg)),
              }),
              chip: t("stats.neverExpire"),
            },
            {
              label: t("stats.spent"),
              value: loading(credits(spent)),
              caption: t("stats.spentCaption", {
                bdt: f.taka(spent),
                count: chats,
                chats: f.n(chats),
              }),
            },
            pro
              ? {
                  label: t("stats.plan"),
                  value: t("stats.pro"),
                  caption: t("stats.proCaption", {
                    bdt: f.n(PRO_PLAN.bdt),
                    date: s.wallet?.proRenewsAt
                      ? f.date(s.wallet.proRenewsAt)
                      : "",
                  }),
                }
              : {
                  label: t("stats.plan"),
                  value: t("stats.payg"),
                  caption: t("stats.paygCaption"),
                  action: {
                    label: t("stats.upgrade"),
                    link: (
                      <button
                        type="button"
                        onClick={() => openOverlay("go-pro")}
                      />
                    ),
                  },
                },
          ]}
        />

        <section id="top-up" className="mt-16 scroll-mt-shell-pad">
          <h2 className="type-wallet-section text-ink">{t("topUp.title")}</h2>
          <p className="mt-2 type-wallet-section-lede text-ink-2">
            {t("topUp.lede")}
          </p>
          <div className="mt-6 flex flex-col items-start gap-4 lg:flex-row">
            <div className="flex w-full min-w-0 flex-col gap-4 lg:w-checkout-main-width">
              <div className="w-full overflow-x-auto">
                <TopUpTable
                  className="min-w-max"
                  title={t("topUp.step1")}
                  columns={{
                    pay: t("topUp.columns.pay"),
                    get: t("topUp.columns.get"),
                    bonus: t("topUp.columns.bonus"),
                    chats: t("topUp.columns.chats"),
                  }}
                  packs={PACKS.map((p) => {
                    const pq = packQuote(p.id);
                    return {
                      value: p.id,
                      price: t("topUp.price", { amount: f.n(p.bdt) }),
                      credits: credits(pq.credits),
                      bonus: p.bonusPercent
                        ? t("topUp.bonus", { pct: f.n(p.bonusPercent) })
                        : undefined,
                      noBonusLabel: t("topUp.noBonus"),
                      chats: f.n(chatsFor(pq.credits, avg)),
                      tag: p.mostChosen ? t("topUp.mostChosen") : undefined,
                    };
                  })}
                  value={custom ? "" : s.selection.pack}
                  onValueChange={walletActions.selectPack}
                  custom={{
                    label: t("topUp.custom", { min: f.n(MIN_CUSTOM_BDT) }),
                    onClick: () =>
                      walletActions.setCustom(s.selection.customBdt),
                  }}
                  teams={{
                    label: t("topUp.teams", { max: f.n(MAX_CUSTOM_BDT) }),
                    href: getPathname({ href: "/settings/help", locale }),
                  }}
                  footnote={t("topUp.footnote", {
                    avg: f.n(Math.round(avg ?? DEFAULT_AVG_CREDITS)),
                  })}
                />
              </div>
              {custom && (
                <div className="w-full rounded-xl border border-blue bg-surface p-6 shadow-stat-card">
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
                          ? t("topUp.customMaxError", {
                              max: f.n(MAX_CUSTOM_BDT),
                            })
                          : undefined
                    }
                  />
                </div>
              )}
              <PaymentMethodSelector
                className="max-w-full self-start"
                title={t("topUp.step2")}
                methods={PAYMENT_METHODS.map((m) => ({
                  value: m,
                  name: f.method(m),
                  description: t(`topUp.methods.${m}`),
                }))}
                value={s.selection.method}
                onValueChange={walletActions.selectMethod}
              />
            </div>
            <div className="flex w-full shrink-0 flex-col gap-4 lg:w-order-summary-width">
              <OrderSummary
                title={t("order.title")}
                total={{
                  label: t("order.youPay"),
                  value: t("topUp.price", { amount: f.n(q?.bdt ?? 0) }),
                }}
                sections={[
                  [
                    { label: t("order.credits"), value: f.n(q?.base ?? 0) },
                    {
                      label: q?.bonusPct
                        ? t("order.bonus", { pct: f.n(q.bonusPct) })
                        : t("order.bonusNone"),
                      value: q?.bonus
                        ? t("order.bonusValue", { credits: f.n(q.bonus) })
                        : t("topUp.noBonus"),
                      tone: q?.bonus ? "success" : "default",
                      kind: q?.bonus ? "number" : "note",
                    },
                    {
                      label: t("order.youGet"),
                      value: credits(q?.credits ?? 0),
                      strong: true,
                    },
                  ],
                  [
                    {
                      label: t("order.newBalance"),
                      value: loading(credits(balance + (q?.credits ?? 0))),
                    },
                    {
                      value: tc("money", {
                        amount: f.taka(balance + (q?.credits ?? 0)),
                      }),
                      kind: "note",
                    },
                  ],
                ]}
                payLabel={
                  q
                    ? t("order.pay", {
                        amount: f.n(q.bdt),
                        method: f.method(s.selection.method),
                      })
                    : t("order.chooseAmount")
                }
                // Enabled once the wallet has loaded (and the page is interactive).
                payDisabled={!q || topUp.busy || known === null}
                onPay={pay}
                trust={[
                  { icon: "square-lock-02", label: t("order.secured") },
                  {
                    icon: "shield-01",
                    label: t("order.neverCharged"),
                    tone: "success",
                  },
                ]}
              />
              {topUp.failed && (
                <p role="alert" className="type-ui text-error">
                  {t("order.startFailed")}
                </p>
              )}
              {!pro && (
                <ProComparisonCard
                  title={t("proCard.title")}
                  columns={{ payg: t("proCard.payg"), pro: t("proCard.pro") }}
                  rows={[
                    {
                      label: t("proCard.price"),
                      payg: t("proCard.priceTaka", {
                        bdt: f.n(PRO_PLAN.paygFromBdt),
                      }),
                      pro: t("proCard.pricePro", { bdt: f.n(PRO_PLAN.bdt) }),
                    },
                    {
                      label: t("proCard.credits"),
                      payg: t("proCard.creditsTaka"),
                      pro: t("proCard.creditsPro", {
                        credits: f.n(PRO_PLAN.credits),
                      }),
                    },
                    {
                      label: t("proCard.expiry"),
                      payg: t("proCard.expiryTaka"),
                      pro: t("proCard.expiryPro"),
                    },
                    {
                      label: t("proCard.models"),
                      payg: t("proCard.modelsTaka"),
                      pro: t("proCard.modelsPro"),
                    },
                  ]}
                  action={{
                    label: t("proCard.details"),
                    onClick: () => openOverlay("go-pro"),
                  }}
                />
              )}
            </div>
          </div>
        </section>

        <CalloutLink
          className="mt-16"
          icon="chart-histogram"
          text={t("usage.text")}
          link={<Link href="/settings/usage" />}
          linkLabel={t("usage.link")}
        />

        <section id="payments" className="mt-12 scroll-mt-shell-pad">
          <div className="flex items-center justify-between gap-4">
            <h2 className="type-wallet-section text-ink">
              {t("payments.title")}
            </h2>
            <button
              type="button"
              onClick={() =>
                downloadText(t("payments.csv.file"), csv(payments, csvHeader))
              }
              className={cx(
                "inline-flex min-h-pro-compare-pill-h items-center gap-1-5 rounded-xs type-wallet-link text-blue hover:underline",
                focusRing,
              )}
            >
              <Icon name="download-01" className="size-icon-sm" />
              {t("payments.export")}
            </button>
          </div>
          <div className="mt-4 w-full overflow-x-auto">
            <PaymentsTable
              className="min-w-max"
              columns={{
                date: t("payments.columns.date"),
                topUp: t("payments.columns.topUp"),
                status: t("payments.columns.status"),
              }}
              rows={payments.map((p) => ({
                id: p.id,
                date: t("payments.date", {
                  date: f.date(p.createdAt),
                  time: f.time(p.createdAt),
                }),
                topUp: t(p.kind === "pro" ? "payments.pro" : "payments.topUp", {
                  amount: f.n(p.bdt),
                  method: f.method(p.method),
                }),
                status:
                  p.status === "paid"
                    ? { label: t("payments.added"), tone: "success" }
                    : { label: t("payments.failed"), tone: "error" },
                action:
                  p.status === "paid"
                    ? {
                        label: t("payments.receipt"),
                        icon: "download-01",
                        onClick: () =>
                          downloadText(
                            t("payments.csv.receiptFile", {
                              reference: reference(p),
                            }),
                            csv([p], csvHeader),
                          ),
                      }
                    : p.kind === "topup"
                      ? {
                          label: t("payments.tryAgain"),
                          onClick: () => retry(p),
                        }
                      : undefined,
              }))}
              footnote={t("payments.footnote")}
            />
          </div>
        </section>
      </main>
      {/* The dialogs read ?payment= from the URL. */}
      <Suspense>
        <WalletDialogs />
      </Suspense>
    </div>
  );
}
