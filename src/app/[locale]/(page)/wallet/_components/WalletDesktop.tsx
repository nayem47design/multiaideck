"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect } from "react";

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
import {
  getPathname,
  Link,
  usePathname,
  useRouter,
} from "@/lib/i18n/navigation";
import {
  AVG_CREDITS_PER_CHAT,
  balanceOf,
  chatsFor,
  DEMO_SPENT,
  MIN_CUSTOM_BDT,
  PACKS,
  PAYMENT_METHODS,
  paymentsNewestFirst,
  PRO_PLAN,
  selectionQuote,
  useWallet,
  wallet,
  type Payment,
} from "@/lib/mock/wallet";

import { useOverlay } from "../../../_shell/overlays";

import { downloadText, usePaymentsCsv, useWalletFormat } from "./format";
import { WalletDialogs } from "./WalletDialogs";

// Figma: Prototype › Wallet (28:9923), 1440×1808, and the checkout overlays over it. Shown from
// 768px; the dialogs follow the route (/wallet/pay, /wallet/paid, /wallet/failed), so the M-screen
// routes open the matching dialog on a wide window.

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
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const { openOverlay } = useOverlay();
  const csv = usePaymentsCsv();

  const balance = balanceOf(s);
  const q = selectionQuote(s.selection);
  const credits = (v: number) => tc("credits", { amount: f.n(v) });
  const custom = s.selection.pack === "custom";
  const customTooLow =
    custom &&
    s.selection.customBdt !== null &&
    s.selection.customBdt < MIN_CUSTOM_BDT;

  useEffect(() => {
    const id = SECTIONS[pathname];
    if (id) document.getElementById(id)?.scrollIntoView({ block: "start" });
  }, [pathname]);

  const pay = () => {
    if (wallet.startCheckout()) router.push("/wallet/pay", { scroll: false });
  };
  const retry = (p: Payment) => {
    wallet.repeat(p);
    pay();
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
              value: credits(balance),
              caption: t("stats.balanceCaption", {
                bdt: f.taka(balance),
                chats: f.n(chatsFor(balance)),
              }),
              chip: t("stats.neverExpire"),
            },
            {
              label: t("stats.spent"),
              value: credits(DEMO_SPENT.credits),
              caption: t("stats.spentCaption", {
                bdt: f.taka(DEMO_SPENT.credits),
                count: DEMO_SPENT.chats,
                chats: f.n(DEMO_SPENT.chats),
              }),
            },
            s.pro
              ? {
                  label: t("stats.plan"),
                  value: t("stats.pro"),
                  caption: t("stats.proCaption", {
                    bdt: f.n(PRO_PLAN.bdt),
                    date: f.date(PRO_PLAN.renews),
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
                    const pq = selectionQuote({ ...s.selection, pack: p.id });
                    return {
                      value: p.id,
                      price: t("topUp.price", { amount: f.n(p.bdt) }),
                      credits: credits(pq?.credits ?? 0),
                      bonus: p.bonusPct
                        ? t("topUp.bonus", { pct: f.n(p.bonusPct) })
                        : undefined,
                      noBonusLabel: t("topUp.noBonus"),
                      chats: f.n(chatsFor(pq?.credits ?? 0)),
                      tag: p.popular ? t("topUp.mostChosen") : undefined,
                    };
                  })}
                  value={custom ? "" : s.selection.pack}
                  onValueChange={wallet.selectPack}
                  custom={{
                    label: t("topUp.custom", { min: f.n(MIN_CUSTOM_BDT) }),
                    onClick: () => wallet.setCustom(s.selection.customBdt),
                  }}
                  teams={{
                    label: t("topUp.teams", {
                      max: f.n(PACKS[PACKS.length - 1].bdt),
                    }),
                    href: getPathname({ href: "/settings/help", locale }),
                  }}
                  footnote={t("topUp.footnote", {
                    avg: f.n(AVG_CREDITS_PER_CHAT),
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
                      customTooLow
                        ? t("topUp.customError", { min: f.n(MIN_CUSTOM_BDT) })
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
                onValueChange={wallet.selectMethod}
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
                      value: credits(balance + (q?.credits ?? 0)),
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
                payDisabled={!q}
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
              {!s.pro && (
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
                downloadText(
                  t("payments.csv.file"),
                  csv(paymentsNewestFirst(s), csvHeader),
                )
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
              rows={paymentsNewestFirst(s).map((p) => ({
                id: p.id,
                date: t("payments.date", {
                  date: f.date(p.at),
                  time: f.time(p.at),
                }),
                topUp: t(p.kind === "pro" ? "payments.pro" : "payments.topUp", {
                  amount: f.n(p.bdt),
                  method: f.method(p.method),
                }),
                status:
                  p.status === "succeeded"
                    ? { label: t("payments.added"), tone: "success" }
                    : { label: t("payments.failed"), tone: "error" },
                action:
                  p.status === "succeeded"
                    ? {
                        label: t("payments.receipt"),
                        icon: "download-01",
                        onClick: () =>
                          downloadText(
                            t("payments.csv.receiptFile", {
                              reference: p.reference,
                            }),
                            csv([p], csvHeader),
                          ),
                      }
                    : p.kind === "top-up"
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
      <WalletDialogs />
    </div>
  );
}
