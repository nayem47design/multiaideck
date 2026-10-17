"use client";

import {
  type DateTimeFormatOptions,
  useFormatter,
  useLocale,
  useTranslations,
} from "next-intl";
import { useEffect, useState } from "react";

import { Button } from "@/components/atoms/Button";
import { FilterPill } from "@/components/atoms/FilterPill";
import { Icon } from "@/components/atoms/Icon";
import { Skeleton } from "@/components/atoms/Skeleton";
import { cx, focusRing } from "@/components/atoms/states";
import { EmptyState } from "@/components/molecules/EmptyState";
import { PeriodSelect } from "@/components/molecules/PeriodSelect";
import { SettingsHeading } from "@/components/molecules/SettingsHeading";
import { SpendTotalCard } from "@/components/molecules/SpendTotalCard";
import { TipCard } from "@/components/molecules/TipCard";
import { UsageSummaryStrip } from "@/components/molecules/UsageSummaryStrip";
import { ActivityTable } from "@/components/organisms/ActivityTable";
import { DailySpendCard } from "@/components/organisms/DailySpendCard";
import { ModelSpendCard } from "@/components/organisms/ModelSpendCard";
import { RecentUsageCard } from "@/components/organisms/RecentUsageCard";
import { UsageCard } from "@/components/organisms/UsageCard";
import { MODEL_SPECS } from "@/lib/ai/catalog";
import { api } from "@/lib/api-client";
import { UsageResponse } from "@/lib/contracts/account";
import { Link, useRouter } from "@/lib/i18n/navigation";

import { useWalletFormat } from "../../wallet/_components/format";

import { downloadFile } from "./download";
import { MobileHeader, ScreenBody, SectionHeading } from "./ScreenParts";
import { useSettings } from "./SettingsState";

// Figma: Settings · Usage (147:38126). Below 768px: M13 · Usage. Data: GET /api/usage?period=
// (from the credits ledger); Export CSV: GET /api/usage/export. A month with nothing spent and no
// questions (e.g. last month for a new account) shows the empty state.

type Period = "this" | "last";
type UsageMode = "best" | "compare" | "image";
const PERIODS = { this: "this-month", last: "last-month" } as const;
/** 1 credit = BDT 0.01. */
const CREDIT_IN_BDT = 0.01;
const TIME_ZONE = "Asia/Dhaka";

/** The usage report for a period, loaded once per period per visit. */
function useUsage(period: Period) {
  const [reports, setReports] = useState<
    Partial<Record<Period, UsageResponse | "error">>
  >({});
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let live = true;
    api(`/api/usage?period=${PERIODS[period]}`, { schema: UsageResponse })
      .then((r) => live && setReports((all) => ({ ...all, [period]: r })))
      .catch(
        () => live && setReports((all) => ({ ...all, [period]: "error" })),
      );
    return () => {
      live = false;
    };
  }, [period, attempt]);
  const r = reports[period];
  const retry = () => {
    setReports((all) => ({ ...all, [period]: undefined }));
    setAttempt((n) => n + 1);
  };
  return { report: r && r !== "error" ? r : null, error: r === "error", retry };
}

const FILTERS = ["all", "best", "compare", "image"] as const;
type Filter = (typeof FILTERS)[number];

export function UsageScreen() {
  const t = useTranslations("settings.usage");
  const tc = useTranslations("common");
  const format = useFormatter();
  const locale = useLocale();
  const { isToday } = useWalletFormat();
  const { showToast } = useSettings();
  const [period, setPeriod] = useState<Period>("this");
  const [filter, setFilter] = useState<Filter>("all");
  const { report, error, retry } = useUsage(period);
  const router = useRouter();
  const [openId, setOpenId] = useState<string | undefined>();
  const firstId = report?.activity[0]?.promptId;
  const [opened, setOpened] = useState<string | undefined>();
  // The newest prompt starts open, as in Figma.
  if (firstId && opened !== firstId && openId === undefined) {
    setOpened(firstId);
    setOpenId(firstId);
  }

  // Answers cost fractions of a credit: one decimal below 10 credits, whole credits above.
  const num = (n: number) =>
    format.number(n, { maximumFractionDigits: Math.abs(n) < 10 ? 1 : 0 });
  const bdt = (credits: number) =>
    format.number(credits * CREDIT_IN_BDT, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  const credits = (n: number) => tc("credits", { amount: num(n) });
  const money = (n: number) => tc("money", { amount: bdt(n) });
  const date = (iso: string, opts: DateTimeFormatOptions) =>
    format.dateTime(new Date(iso), { ...opts, timeZone: TIME_ZONE });
  const day = (iso: string) => date(iso, { month: "short", day: "numeric" });
  const time = (iso: string) =>
    date(iso, { hour: "numeric", minute: "2-digit" });

  const loading = (v: string) => (report ? v : tc("loading"));
  const total = report?.spent.credits ?? 0;
  const prompts = report?.prompts ?? 0;
  const chats = report?.chats ?? 0;
  const byModel = (report?.byModel ?? []).map((m) => ({
    ...m,
    name: MODEL_SPECS[m.model].name,
    short: MODEL_SPECS[m.model].short,
    pct: Math.round(m.share * 100),
  }));
  const all = (report?.activity ?? []).map((a) => ({
    ...a,
    id: a.promptId,
    mode: (a.mode ?? "compare") as UsageMode,
  }));
  const daily = report?.daily ?? [];
  const refunds = all.reduce(
    (n, a) => n + a.breakdown.filter((b) => b.status !== "done").length,
    0,
  );
  const average = report?.averagePromptCredits ?? 0;
  const activity = all.filter((a) => filter === "all" || a.mode === filter);

  const exportCsv = async () => {
    try {
      const res = await fetch(
        `/api/usage/export?period=${PERIODS[period]}&locale=${locale}`,
        { credentials: "same-origin" },
      );
      if (!res.ok) throw new Error(`export ${res.status}`);
      downloadFile("multiai-usage.csv", "text/csv", await res.text());
      showToast(t("exported"));
    } catch {
      showToast(t("exportFailed"));
    }
  };

  const periodSelect = (
    <PeriodSelect
      label={t("period.label")}
      value={period}
      onValueChange={(v) => setPeriod(v as Period)}
      options={[
        { value: "this", label: t("period.this") },
        { value: "last", label: t("period.last") },
      ]}
    />
  );

  // Empty, loading and error: 04 · Desktop screens, row 10 (Settings · Usage · Empty / Loading /
  // Error). Last month gets its own message for people who started this month.
  const blank = report && report.spent.credits === 0 && report.prompts === 0;
  const state = error ? (
    <EmptyState
      tone="error"
      title={t("loadError")}
      body={tc("loadErrorBody")}
      action={
        <Button variant="secondary" size="sm" onClick={retry}>
          {tc("tryAgain")}
        </Button>
      }
    />
  ) : !report ? (
    <UsageSkeleton label={tc("loading")} />
  ) : blank && period === "last" ? (
    <EmptyState
      icon="chart-histogram"
      title={t("lastMonth.title")}
      body={t("lastMonth.body")}
    />
  ) : blank ? (
    <EmptyState
      icon="chart-histogram"
      title={t("empty.title")}
      body={t("empty.body")}
      action={
        <Button variant="secondary" size="sm" onClick={() => router.push("/")}>
          {t("empty.action")}
        </Button>
      }
    />
  ) : null;

  return (
    <div className="flex flex-col">
      <MobileHeader title={t("title")} aside={periodSelect} />
      <ScreenBody>
        <SettingsHeading
          className="max-md:hidden"
          title={t("title")}
          subtitle={t("subtitle")}
          actions={
            <>
              {periodSelect}
              {!state && (
                <button
                  type="button"
                  onClick={() => void exportCsv()}
                  className={cx(
                    "inline-flex h-usage-period-height items-center gap-1-5 rounded-xs type-settings-link text-blue hover:underline",
                    focusRing,
                  )}
                >
                  <Icon name="download-01" className="size-icon-sm" />
                  {t("export")}
                </button>
              )}
            </>
          }
        />
        {state || (
          <>
            {/* Desktop (Settings · Usage) */}
            <div className="flex flex-col gap-12 max-md:hidden">
              <UsageSummaryStrip
                stats={[
                  {
                    label: t("stats.spent"),
                    value: loading(credits(total)),
                    caption: t("stats.spentCaption", { money: money(total) }),
                  },
                  {
                    label: t("stats.prompts"),
                    value: loading(num(prompts)),
                    caption: t("stats.promptsCaption", { chats }),
                  },
                  {
                    label: t("stats.average"),
                    value: loading(credits(average)),
                    caption: t("stats.averageCaption"),
                  },
                  {
                    label: t("stats.vsLast"),
                    value: t("stats.vsLastValue"),
                    caption: t("stats.vsLastCaption"),
                  },
                ]}
              />
              <section className="flex flex-col gap-4">
                <SectionHeading>{t("byModel.heading")}</SectionHeading>
                <UsageCard
                  className="max-lg:flex-col max-lg:[&>section]:w-full"
                  title={t("byModel.title")}
                  total={t("byModel.total", {
                    credits: credits(total),
                    money: money(total),
                  })}
                  rows={byModel.map((m) => ({
                    model: m.model,
                    name: m.name,
                    credits: credits(m.credits),
                    money: money(m.credits),
                    share: m.pct,
                    shareLabel: format.number(m.pct / 100, {
                      style: "percent",
                    }),
                  }))}
                  insight={{
                    label: t("byModel.insightLabel"),
                    title: t("byModel.insightTitle"),
                    body: t("byModel.insightBody"),
                    footnote: t("byModel.insightFootnote", { prompts }),
                  }}
                />
              </section>
              <section className="flex flex-col gap-4">
                <SectionHeading>{t("daily.heading")}</SectionHeading>
                <DailySpendCard
                  label={
                    daily.length
                      ? t("daily.label", {
                          from: day(`${daily[0].date}T12:00:00+06:00`),
                          to: day(`${daily.at(-1)!.date}T12:00:00+06:00`),
                        })
                      : tc("loading")
                  }
                  days={daily.map((d, i, all) => ({
                    key: d.date,
                    label: day(`${d.date}T12:00:00+06:00`),
                    showLabel:
                      i === 0 ||
                      i === all.length - 1 ||
                      i === Math.floor((all.length - 1) / 2),
                    value: d.credits,
                    valueLabel: tc("creditsShort", { amount: num(d.credits) }),
                  }))}
                  footer={
                    <p className="flex flex-wrap items-center gap-x-2">
                      <span className="type-ui text-ink-2">
                        {t("daily.noLimit")}
                      </span>
                      <Link
                        href="/wallet"
                        className={cx(
                          "rounded-xs type-ui-strong text-blue hover:underline",
                          focusRing,
                        )}
                      >
                        {t("daily.setLimit")}
                      </Link>
                    </p>
                  }
                />
              </section>
              <section className="flex flex-col gap-4">
                <SectionHeading
                  aside={
                    <div
                      role="group"
                      aria-label={t("activity.filters.label")}
                      className="flex flex-wrap gap-1-5"
                    >
                      {FILTERS.map((f) => (
                        <FilterPill
                          key={f}
                          selected={filter === f}
                          onClick={() => setFilter(f)}
                        >
                          {t(`activity.filters.${f}`)}
                        </FilterPill>
                      ))}
                    </div>
                  }
                >
                  {t("activity.heading")}
                </SectionHeading>
                <div className="max-lg:overflow-x-auto">
                  <ActivityTable
                    className="max-lg:min-w-max"
                    columns={{
                      date: t("activity.columns.date"),
                      chat: t("activity.columns.chat"),
                      models: t("activity.columns.models"),
                      credits: t("activity.columns.credits"),
                      money: t("activity.columns.money"),
                    }}
                    rows={activity.map((a) => ({
                      id: a.id,
                      date: t("activity.date", {
                        date: day(a.date),
                        time: time(a.date),
                      }),
                      chat: a.chat,
                      models: a.breakdown.map((b) => b.model),
                      modelsLabel: t("activity.modelsCount", {
                        count: a.breakdown.length,
                      }),
                      credits: credits(a.credits),
                      money: money(a.credits),
                      breakdown: a.breakdown.map((b) => ({
                        model: b.model,
                        name: MODEL_SPECS[b.model].name,
                        credits: credits(b.credits),
                        money: money(b.credits),
                      })),
                    }))}
                    openId={openId}
                    onToggle={(id) =>
                      setOpenId((current) => (current === id ? undefined : id))
                    }
                    toggleLabel={(chat) => t("activity.toggle", { chat })}
                    footnote={
                      activity.length
                        ? t("activity.footnote")
                        : t("activity.empty")
                    }
                  />
                </div>
                <p className="flex items-start gap-2 type-ui text-ink-2">
                  <Icon
                    name="refresh"
                    className="mt-0-5 size-icon-sm shrink-0"
                  />
                  {t("activity.refunds")}
                </p>
              </section>
            </div>

            {/* Mobile (M13 · Usage) */}
            <div className="flex flex-col gap-3 md:hidden">
              <SpendTotalCard
                label={t("mobile.spent")}
                value={loading(credits(total))}
                secondary={t("mobile.about", {
                  taka: tc("taka", { amount: bdt(total) }),
                })}
                caption={t("mobile.summary", { prompts, refunds })}
              />
              <ModelSpendCard
                title={t("mobile.byAi")}
                rows={byModel.map((m) => ({
                  model: m.model,
                  name: m.short,
                  credits: credits(m.credits),
                  share: m.pct,
                  shareLabel: format.number(m.pct / 100, {
                    style: "percent",
                  }),
                }))}
              />
              <TipCard icon="idea-01" title={t("mobile.tipTitle")}>
                {t("mobile.tipBody")}
              </TipCard>
              <RecentUsageCard
                title={t("mobile.recent")}
                emptyLabel={t("mobile.empty")}
                items={all.map((a) => ({
                  id: a.id,
                  title: a.chat,
                  meta: t("mobile.itemMeta", {
                    when: isToday(a.date)
                      ? t("mobile.today", { time: time(a.date) })
                      : day(a.date),
                    count: a.breakdown.length,
                  }),
                  amount: tc("creditsShort", { amount: num(a.credits) }),
                  models: a.breakdown.map((b) => b.model),
                  link: <Link href={a.chatId ? `/c/${a.chatId}` : "/images"} />,
                }))}
                footnote={t("mobile.refunds")}
              />
            </div>
          </>
        )}
      </ScreenBody>
    </div>
  );
}

/** Loading: the page's cards with placeholder rows (Figma: Settings · Usage · Loading). */
function UsageSkeleton({ label }: { label: string }) {
  const card = "rounded-xl border border-line bg-surface";
  return (
    <div role="status" aria-label={label} className="flex flex-col gap-12">
      <div className={cx(card, "grid grid-cols-2 md:grid-cols-4")}>
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="p-5" />
        ))}
      </div>
      <div className={cx(card, "py-3")}>
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} variant="table-row" />
        ))}
      </div>
      <div className={cx(card, "p-6")}>
        <span className="block aspect-[5/1] w-full rounded-images-tile bg-canvas-deep" />
      </div>
    </div>
  );
}
