import type { ReactNode } from "react";

import { Icon, type IconName } from "@/components/atoms/Icon";
import { cx } from "@/components/atoms/states";

// Figma: Design system › Data card (103:29293): data rows with an action.

export interface DataCardProps {
  title: string;
  rows: { icon: IconName; title: string; help: string; action: ReactNode }[];
  className?: string;
}

export function DataCard({ title, rows, className }: DataCardProps) {
  return (
    <section
      className={cx(
        "flex w-full flex-col rounded-xl border border-line bg-surface px-6 pt-6 pb-3 shadow-stat-card",
        className,
      )}
    >
      <h2 className="pb-3 type-step-title text-ink">{title}</h2>
      {rows.map((row) => (
        <div
          key={row.title}
          className="flex items-center gap-4 border-t border-line py-4"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-data-tile bg-canvas text-ink-2">
            <Icon name={row.icon} className="size-icon-button-icon" />
          </span>
          <span className="flex min-w-0 flex-1 flex-col gap-0-5">
            <span className="type-setting-row-title text-ink">{row.title}</span>
            <span className="type-setting-row-help text-ink-3">{row.help}</span>
          </span>
          {row.action}
        </div>
      ))}
    </section>
  );
}
