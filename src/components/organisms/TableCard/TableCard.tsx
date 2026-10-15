import type { ReactNode } from "react";

import { cx } from "@/components/atoms/states";

// Shared frame of Figma's Activity table (103:21035) and Payments table (103:29333):
// card, header row of overlines, body, footnote. Not a separate Figma component.

export interface TableColumn {
  label: string;
  /** Width class from the Figma column, e.g. "w-activity-col-date". */
  width: string;
}

export interface TableCardProps {
  columns: TableColumn[];
  children: ReactNode;
  footnote?: string;
  className?: string;
}

export function TableCard({
  columns,
  children,
  footnote,
  className,
}: TableCardProps) {
  return (
    <div
      role="table"
      className={cx(
        "flex w-full flex-col rounded-xl border border-line bg-surface p-2 shadow-stat-card",
        className,
      )}
    >
      <div role="row" className="flex h-control-md items-center px-4 py-2">
        {columns.map((c) => (
          <span
            key={c.label || c.width}
            role="columnheader"
            className={cx("shrink-0 type-overline text-ink-3", c.width)}
          >
            {c.label}
          </span>
        ))}
      </div>
      <div role="rowgroup" className="flex flex-col">
        {children}
      </div>
      {footnote && (
        <p className="px-4 pt-2 pb-1-5 type-caption text-ink-3">{footnote}</p>
      )}
    </div>
  );
}

export function TableCell({
  width,
  children,
  className,
}: {
  width: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <span
      role="cell"
      className={cx("flex shrink-0 items-center gap-2", width, className)}
    >
      {children}
    </span>
  );
}
