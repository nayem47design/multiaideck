import type { ReactNode } from "react";

import { Icon, type IconName } from "@/components/atoms/Icon";
import { cx } from "@/components/atoms/states";

// Shared layout of Figma's Checkout dialog (103:21288) and Payment result dialog (103:21324):
// centred icon, title, body, summary rows, full-width actions.

export interface HeroDialogProps {
  /** Small line above the icon, e.g. "Secure checkout · PayStation". */
  head?: { icon: IconName; label: string };
  icon: IconName;
  tone: "info" | "success" | "error";
  title: string;
  body: string;
  /** Summary rows; values are mono numbers unless `text`. */
  summary?: { label: string; value: string; text?: boolean }[];
  /** Full-width buttons, top to bottom. */
  actions: ReactNode;
}

const tones = {
  info: "bg-blue-soft text-blue",
  success: "bg-status-success-soft text-success",
  error: "bg-status-error-soft text-error",
};

export function HeroDialogPanel({
  head,
  icon,
  tone,
  title,
  body,
  summary,
  actions,
}: HeroDialogProps) {
  return (
    <div className="flex w-dialog-sm-width flex-col items-center gap-4 rounded-2xl bg-surface p-8 shadow-dialog">
      {head && (
        <p className="flex items-center gap-2 type-caption text-ink-3">
          <Icon name={head.icon} className="size-order-summary-trust-icon" />
          {head.label}
        </p>
      )}
      <span
        className={cx(
          "flex size-14 items-center justify-center rounded-pill",
          tones[tone],
        )}
      >
        <Icon name={icon} className="size-6" />
      </span>
      <h2 className="text-center type-dialog-hero-title text-ink">{title}</h2>
      <p className="w-full text-center type-dialog-hero-body text-ink-2">
        {body}
      </p>
      {summary && (
        <dl className="flex w-full flex-col rounded-md border border-line">
          {summary.map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between px-4 py-2"
            >
              <dt className="type-dialog-summary-label text-ink-3">
                {row.label}
              </dt>
              <dd
                className={cx(
                  "text-ink",
                  row.text ? "type-label" : "type-dialog-summary-value",
                )}
              >
                {row.value}
              </dd>
            </div>
          ))}
        </dl>
      )}
      <div className="flex w-full flex-col gap-4">{actions}</div>
    </div>
  );
}
