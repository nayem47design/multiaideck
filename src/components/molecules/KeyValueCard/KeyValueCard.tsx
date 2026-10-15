import { Fragment } from "react";

import { Divider } from "@/components/atoms/Divider";
import { cx } from "@/components/atoms/states";

// Figma: Prototype › M12 · Payment received › "Receipt": label / value lines in groups split by
// a divider. A strong value (the new balance) is medium and larger.

export interface KeyValueRow {
  label: string;
  value: string;
  strong?: boolean;
}

export interface KeyValueCardProps {
  sections: KeyValueRow[][];
  className?: string;
}

export function KeyValueCard({ sections, className }: KeyValueCardProps) {
  return (
    <dl
      className={cx(
        "flex flex-col gap-3 rounded-lg border border-line bg-surface p-m-receipt-pad",
        className,
      )}
    >
      {sections.map((rows, i) => (
        <Fragment key={i}>
          {i > 0 && <Divider />}
          {rows.map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between gap-3"
            >
              <dt className="type-ui text-ink-2">{row.label}</dt>
              <dd
                className={cx(
                  "text-right text-ink",
                  row.strong ? "type-m-button" : "type-m-receipt-value",
                )}
              >
                {row.value}
              </dd>
            </div>
          ))}
        </Fragment>
      ))}
    </dl>
  );
}
