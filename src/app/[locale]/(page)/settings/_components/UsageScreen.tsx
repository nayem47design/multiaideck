"use client";

import {
  type DateTimeFormatOptions,
  useFormatter,
  useTranslations,
} from "next-intl";
import { useState } from "react";

import { FilterPill } from "@/components/atoms/FilterPill";
import { Icon } from "@/components/atoms/Icon";
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
import { Link } from "@/lib/i18n/navigation";
import { CREDIT_IN_BDT } from "@/lib/mock/demo";
import {
  DEMO_DAILY_SPEND,
  DEMO_TIME_ZONE,
  DEMO_TODAY,
  DEMO_USAGE_ACTIVITY,
  DEMO_USAGE_BY_MODEL,
  DEMO_USAGE_SUMMARY,
  type UsageMode,
} from "@/lib/mock/settings";

import { downloadFile } from "./download";
import { MobileHeader, ScreenBody, SectionHeading } from "./ScreenParts";
import { useSettings } from "./SettingsState";

// Figma: Settings · Usage (147:38126). Below 768px: M13 · Usage. "Last month" has no data in the
// demo (the person joined this month), so it shows an empty state.

type Period = "this" | "last";
const FILTERS = ["all", "best", "compare", "image"] as const;
type Filter = (typeof FILTERS)[number];

export function UsageScreen() {
  const t = useTranslations("settings.usage");
  const tc = useTranslations("common");
  const format = useFormatter();
  const { showToast } = useSettings();
  const [period, setPeriod] = useState<Period>("this");
  const [filter, setFilter] = useState<Filter>("all");
  const [openId, setOpenId] = useState<string | undefined>(
    DEMO_USAGE_ACTIVITY[0]?.id,
  );

  const num = (n: number) => format.number(n);
  const bdt = (credits: number) =>
    format.number(credits * CREDIT_IN_BDT, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  const credits = (n: number) => tc("credits", { amount: num(n) });
  const money = (n: number) => tc("money", { amount: bdt(n) });
  const date = (iso: string, opts: DateTimeFormatOptions) =>
    format.dateTime(new Date(iso), { ...opts, timeZone: DEMO_TIME_ZONE });
  const day = (iso: string) => date(iso, { month: "short", day: "numeric" });
  const time = (iso: string) =>
    date(iso, { hour: "numeric", minute: "2-digit" });

  const total = DEMO_USAGE_SUMMARY.credits;
  const share = (n: number) => Math.round((n / total) * 100);
  const average = total / DEMO_USAGE_SUMMARY.prompts;
  const activity = DEMO_USAGE_ACTIVITY.filter(
    (a) => filter === "all" || a.mode === filter,
  );
  const modeLabel = (mode: UsageMode) => t(`activity.filters.${mode}`);

  const exportCsv = () => {
    const header = (
      ["date", "chat", "mode", "model", "credits", "taka"] as const
    )
      .map((k) => t(`csv.${k}`))
      .join(",");
    const lines = DEMO_USAGE_ACTIVITY.flatMap((a) =>
      a.breakdown.map((b) =>
        [
          a.at,
          a.chat,
          modeLabel(a.mode),
          b.name,
          b.credits,
          (b.credits * CREDIT_IN_BDT).toFixed(2),
        ]
          .map((v) => `"${String(v).replaceAll('"', '""')}"`)
          .join(","),
      ),
    );
    downloadFile(
      "multiai-usage.csv",
      "text/csv",
      [header, ...lines].join("\n"),
    );
    showToast(t("exported"));
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

  const empty = period === "last" && (
    <EmptyState
      icon="chart-histogram"
      title={t("lastMonth.title")}
      body={t("lastMonth.body")}
    />
  );

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
              <button
                type="button"
                onClick={exportCsv}
                className={cx(
                  "inline-flex h-usage-period-height items-center gap-1-5 rounded-xs type-settings-link text-blue hover:underline",
                  focusRing,
                )}
              >
                <Icon name="download-01" className="size-icon-sm" />
                {t("export")}
              </button>
            </>
          }
        />
        {empty || (
          <>
            {/* Desktop (Settings · Usage) */}
            <div className="flex flex-col gap-12 max-md:hidden">
              <UsageSummaryStrip
                stats={[
                  {
                    label: t("stats.spent"),
                    value: credits(total),
                    caption: t("stats.spentCaption", { money: money(total) }),
                  },
                  {
                    label: t("stats.prompts"),
                    value: num(DEMO_USAGE_SUMMARY.prompts),
                    caption: t("stats.promptsCaption", {
                      chats: DEMO_USAGE_SUMMARY.chats,
                    }),
                  },
                  {
                    label: t("stats.average"),
                    value: credits(average),
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
                  rows={DEMO_USAGE_BY_MODEL.map((m) => ({
                    model: m.model,
                    name: m.name,
                    credits: credits(m.credits),
                    money: money(m.credits),
                    share: share(m.credits),
                    shareLabel: format.number(share(m.credits) / 100, {
                      style: "percent",
                    }),
                  }))}
                  insight={{
                    label: t("byModel.insightLabel"),
                    title: t("byModel.insightTitle"),
                    body: t("byModel.insightBody"),
                    footnote: t("byModel.insightFootnote", {
                      prompts: DEMO_USAGE_SUMMARY.prompts,
                    }),
                  }}
                />
              </section>
              <section className="flex flex-col gap-4">
                <SectionHeading>{t("daily.heading")}</SectionHeading>
                <DailySpendCard
                  label={t("daily.label", {
                    from: day(`${DEMO_DAILY_SPEND[0].day}T12:00:00+06:00`),
                    to: day(`${DEMO_DAILY_SPEND.at(-1)!.day}T12:00:00+06:00`),
                  })}
                  days={DEMO_DAILY_SPEND.map((d, i, all) => ({
                    key: d.day,
                    label: day(`${d.day}T12:00:00+06:00`),
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
                        date: day(a.at),
                        time: time(a.at),
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
                        name: b.name,
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
                value={credits(total)}
                secondary={t("mobile.about", {
                  taka: tc("taka", { amount: bdt(total) }),
                })}
                caption={t("mobile.summary", {
                  prompts: DEMO_USAGE_SUMMARY.prompts,
                  refunds: DEMO_USAGE_SUMMARY.refunds,
                })}
              />
              <ModelSpendCard
                title={t("mobile.byAi")}
                rows={DEMO_USAGE_BY_MODEL.map((m) => ({
                  model: m.model,
                  name: m.short,
                  credits: credits(m.credits),
                  share: share(m.credits),
                  shareLabel: format.number(share(m.credits) / 100, {
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
                items={DEMO_USAGE_ACTIVITY.map((a) => ({
                  id: a.id,
                  title: a.chat,
                  meta: t("mobile.itemMeta", {
                    when: a.at.startsWith(DEMO_TODAY)
                      ? t("mobile.today", { time: time(a.at) })
                      : day(a.at),
                    count: a.breakdown.length,
                  }),
                  amount: tc("creditsShort", { amount: num(a.credits) }),
                  models: a.breakdown.map((b) => b.model),
                  link: <Link href={`/c/${a.chatId}`} />,
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
