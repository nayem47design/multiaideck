import { Fragment } from "react";

import { Divider } from "@/components/atoms/Divider";
import { Icon, type IconName } from "@/components/atoms/Icon";
import { cx, focusRing, stateLayer } from "@/components/atoms/states";

// Figma: Design system › Order summary (28:8693): the wallet checkout summary.

export interface OrderSummaryRow {
  label?: string;
  value: string;
  /** Medium label, e.g. "You get". */
  strong?: boolean;
  /** Numbers are mono; a plain note (e.g. "≈ BDT 875.74") is not. */
  kind?: "number" | "note";
  tone?: "default" | "success";
}

export interface OrderSummaryProps {
  /** e.g. "ORDER SUMMARY". */
  title: string;
  total: { label: string; value: string };
  /** Groups of rows, separated by dividers. */
  sections: OrderSummaryRow[][];
  payLabel: string;
  onPay?: () => void;
  trust: { icon: IconName; label: string; tone?: "muted" | "success" }[];
  className?: string;
}

export function OrderSummary({
  title,
  total,
  sections,
  payLabel,
  onPay,
  trust,
  className,
}: OrderSummaryProps) {
  return (
    <section
      className={cx(
        "flex w-full flex-col gap-4 rounded-xl border border-glass-rim glass-strong p-6 shadow-order-summary",
        className,
      )}
    >
      <h2 className="type-overline text-ink-3">{title}</h2>
      <p className="flex items-center justify-between">
        <span className="type-order-summary-label-strong text-ink">
          {total.label}
        </span>
        <span className="type-order-summary-total text-ink">{total.value}</span>
      </p>
      {sections.map((rows, i) => (
        <Fragment key={i}>
          <Divider />
          {rows.map((row, j) => (
            <p key={j} className="flex items-center justify-between">
              <span
                className={
                  row.strong
                    ? "type-order-summary-label-strong text-ink"
                    : "type-order-summary-label text-ink-2"
                }
              >
                {row.label}
              </span>
              <span
                className={cx(
                  row.kind === "note"
                    ? "type-order-summary-label text-ink-3"
                    : "type-order-summary-value",
                  row.kind !== "note" &&
                    (row.tone === "success" ? "text-success" : "text-ink"),
                )}
              >
                {row.value}
              </span>
            </p>
          ))}
        </Fragment>
      ))}
      <button
        type="button"
        onClick={onPay}
        className={cx(
          "inline-flex h-12 w-full items-center justify-center gap-2 rounded-pill bg-cta type-order-summary-pay text-on-cta",
          stateLayer,
          focusRing,
        )}
      >
        {payLabel}
        <Icon name="arrow-right-02" className="size-icon-sm" />
      </button>
      {trust.map((t) => (
        <p key={t.label} className="flex items-center gap-1-5">
          <Icon
            name={t.icon}
            className={cx(
              "size-order-summary-trust-icon",
              t.tone === "success" ? "text-success" : "text-ink-3",
            )}
          />
          <span
            className={cx(
              "type-caption",
              t.tone === "success" ? "text-ink-2" : "text-ink-3",
            )}
          >
            {t.label}
          </span>
        </p>
      ))}
    </section>
  );
}
