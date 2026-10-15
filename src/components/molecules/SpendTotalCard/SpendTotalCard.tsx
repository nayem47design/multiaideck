import { cx } from "@/components/atoms/states";

// Figma: Prototype › M13 · Usage › "Total": what you spent this period, in credits and taka.

export interface SpendTotalCardProps {
  /** e.g. "You spent". */
  label: string;
  /** e.g. "26 credits". */
  value: string;
  /** e.g. "about ৳0.26". */
  secondary: string;
  /** e.g. "1 question this month · 0 refunds". */
  caption: string;
  className?: string;
}

export function SpendTotalCard({
  label,
  value,
  secondary,
  caption,
  className,
}: SpendTotalCardProps) {
  return (
    <section
      className={cx(
        "flex flex-col gap-1 rounded-lg border border-line bg-surface p-acct-usage-card-pad",
        className,
      )}
    >
      <h2 className="type-ui-strong text-ink-2">{label}</h2>
      <p className="flex flex-wrap items-baseline gap-x-2">
        <span className="type-acct-usage-total text-ink">{value}</span>
        <span className="type-ui text-ink-2">{secondary}</span>
      </p>
      <p className="type-ui text-ink-2">{caption}</p>
    </section>
  );
}
