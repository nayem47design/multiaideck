import { Icon } from "@/components/atoms/Icon";
import { cx, focusRing, stateLayer } from "@/components/atoms/states";

// Figma: Prototype › Wallet › "Pro comparison" (beside the order summary): a small table of
// Pay as you go vs Pro and a pill that opens Go Pro. Not a Design system component yet.

export interface ProComparisonRow {
  label: string;
  payg: string;
  pro: string;
}

export interface ProComparisonCardProps {
  /** e.g. "Use AI every day? Try Pro". */
  title: string;
  columns: { payg: string; pro: string };
  rows: ProComparisonRow[];
  action: { label: string; onClick?: () => void };
  className?: string;
}

const col = [
  "w-pro-compare-col-1",
  "w-pro-compare-col-2",
  "min-w-0 flex-1 max-w-pro-compare-col-3",
];

export function ProComparisonCard({
  title,
  columns,
  rows,
  action,
  className,
}: ProComparisonCardProps) {
  return (
    <section
      className={cx(
        "flex w-full flex-col gap-3 rounded-xl border border-line bg-surface p-6 shadow-stat-card",
        className,
      )}
    >
      <h2 className="flex items-center gap-2 type-pro-compare-title text-ink">
        <Icon name="crown" className="size-icon-sm text-status-warning" />
        {title}
      </h2>
      <div
        role="table"
        aria-label={title}
        className="flex flex-col overflow-hidden rounded-pro-compare-table border border-line"
      >
        <div
          role="row"
          className="flex h-pro-compare-row-h items-center bg-canvas px-3"
        >
          {["", columns.payg, columns.pro].map((label, i) => (
            <span
              key={i}
              role="columnheader"
              className={cx(
                "shrink-0 type-pro-compare-head text-ink-3",
                col[i],
              )}
            >
              {label}
            </span>
          ))}
        </div>
        {rows.map((row) => (
          <div
            key={row.label}
            role="row"
            className="flex h-pro-compare-row-h items-center px-3"
          >
            <span
              role="rowheader"
              className={cx(
                "shrink-0 type-pro-compare-cell text-ink-3",
                col[0],
              )}
            >
              {row.label}
            </span>
            <span
              role="cell"
              className={cx("shrink-0 type-pro-compare-cell text-ink", col[1])}
            >
              {row.payg}
            </span>
            <span
              role="cell"
              className={cx(
                "type-pro-compare-cell whitespace-nowrap text-ink",
                col[2],
              )}
            >
              {row.pro}
            </span>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={action.onClick}
        className={cx(
          "inline-flex h-pro-compare-pill-h items-center self-start rounded-pill border border-line bg-surface px-4 type-wallet-link text-ink",
          stateLayer,
          focusRing,
        )}
      >
        {action.label}
      </button>
    </section>
  );
}
