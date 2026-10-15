import type { ReactNode } from "react";

import { cx } from "@/components/atoms/states";

// Figma: Prototype › Settings · Usage › "Daily spend card": one bar per day on a baseline (empty
// days are a short line-coloured stub), the amount over days with spend, a few date labels, and a
// footer (the spending limit). Bars scale to the busiest day.

export interface DailySpendDay {
  key: string;
  /** e.g. "Oct 14". */
  label: string;
  /** Show the date under the bar (Figma labels the first, middle and last days). */
  showLabel?: boolean;
  value: number;
  /** e.g. "26 cr"; shown over bars with spend. */
  valueLabel: string;
}

export interface DailySpendCardProps {
  days: DailySpendDay[];
  /** Accessible summary of the chart, e.g. "Credits spent per day, Oct 1–14". */
  label: string;
  footer?: ReactNode;
  className?: string;
}

export function DailySpendCard({
  days,
  label,
  footer,
  className,
}: DailySpendCardProps) {
  const max = Math.max(1, ...days.map((d) => d.value));
  return (
    <section
      className={cx(
        "flex flex-col gap-4 rounded-xl border border-line bg-surface p-6",
        className,
      )}
    >
      <figure className="flex h-usage-chart-height flex-col">
        <figcaption className="sr-only">{label}</figcaption>
        <ol className="flex min-h-0 flex-1 items-end border-b border-line">
          {days.map((day) => (
            <li
              key={day.key}
              className="flex min-w-0 flex-1 flex-col items-center justify-end gap-1"
            >
              {day.value > 0 && (
                <span className="type-mono whitespace-nowrap text-ink">
                  {day.valueLabel}
                </span>
              )}
              <span
                aria-hidden
                className={cx(
                  "block w-usage-chart-bar-width max-w-full rounded-t-xs",
                  day.value > 0 ? "bg-blue" : "h-usage-chart-bar-empty bg-line",
                )}
                style={
                  day.value > 0
                    ? {
                        height: `calc(var(--usage-chart-bar-max) * ${day.value / max})`,
                      }
                    : undefined
                }
              />
              <span className="sr-only">
                {day.label}: {day.valueLabel}
              </span>
            </li>
          ))}
        </ol>
        <div aria-hidden className="flex pt-2">
          {days.map((day) => (
            <span
              key={day.key}
              className="flex h-usage-chart-label-height min-w-0 flex-1 justify-center overflow-visible type-caption whitespace-nowrap text-ink-2"
            >
              {day.showLabel ? day.label : null}
            </span>
          ))}
        </div>
      </figure>
      {footer}
    </section>
  );
}
