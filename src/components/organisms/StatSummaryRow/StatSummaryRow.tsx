import { cloneElement, type ReactElement } from "react";

import { Icon } from "@/components/atoms/Icon";
import { cx } from "@/components/atoms/states";

// Figma: Design system › Stat summary row (103:20772): three stat cards of equal width.

export interface StatCardProps {
  /** e.g. "BALANCE". */
  label: string;
  value: string;
  caption: string;
  /** Success chip, e.g. "Credits never expire". */
  chip?: string;
  /** e.g. { label: "Upgrade Now", link: <Link href="/wallet/pro" /> }. */
  action?: { label: string; link: ReactElement<{ className?: string }> };
}

export function StatCard({
  label,
  value,
  caption,
  chip,
  action,
}: StatCardProps) {
  return (
    <section className="flex min-w-0 flex-1 flex-col gap-2 rounded-xl border border-line bg-surface p-6 shadow-stat-card">
      <h3 className="type-overline text-ink-3">{label}</h3>
      <p className="type-stat-value text-ink">{value}</p>
      <p className="type-stat-caption text-ink-2">{caption}</p>
      {chip && (
        <span className="inline-flex items-center gap-1-5 self-start rounded-pill bg-status-success-soft px-3 py-1 type-stat-chip text-success">
          <Icon name="tick-02" className="size-select-icon" />
          {chip}
        </span>
      )}
      {action &&
        cloneElement(
          action.link,
          {
            className:
              "inline-flex items-center gap-1-5 self-start text-blue type-label hover:underline",
          },
          <Icon
            key="i"
            name="crown"
            className="size-select-icon text-status-warning"
          />,
          action.label,
        )}
    </section>
  );
}

export function StatSummaryRow({
  stats,
  className,
}: {
  stats: StatCardProps[];
  className?: string;
}) {
  return (
    <div className={cx("flex w-full items-stretch gap-4", className)}>
      {stats.map((stat) => (
        <StatCard key={stat.label} {...stat} />
      ))}
    </div>
  );
}
