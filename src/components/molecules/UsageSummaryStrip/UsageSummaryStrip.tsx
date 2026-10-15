import { cx } from "@/components/atoms/states";

// Figma: Prototype › Settings · Usage › "Usage summary": four stats in one card, split by lines.
// Below 1024px the stats wrap to two columns.

export interface UsageSummaryStat {
  /** e.g. "CREDITS SPENT". */
  label: string;
  value: string;
  caption: string;
}

export interface UsageSummaryStripProps {
  stats: UsageSummaryStat[];
  className?: string;
}

export function UsageSummaryStrip({
  stats,
  className,
}: UsageSummaryStripProps) {
  return (
    <dl
      className={cx(
        "grid grid-cols-2 overflow-hidden rounded-xl border border-line bg-surface lg:grid-cols-4",
        className,
      )}
    >
      {stats.map((stat, i) => (
        <div
          key={stat.label}
          className={cx(
            "flex min-w-0 flex-col gap-1-5 border-line p-usage-stat-pad",
            i % 2 === 1 && "border-l",
            i >= 2 && "border-t lg:border-t-0",
            i === 2 && "lg:border-l",
          )}
        >
          <dt className="type-label text-ink-2">{stat.label}</dt>
          <dd className="type-title text-ink">{stat.value}</dd>
          <dd className="type-caption text-ink-2">{stat.caption}</dd>
        </div>
      ))}
    </dl>
  );
}
