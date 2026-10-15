import type { HTMLAttributes } from "react";

import { cx } from "../states";

// Figma: Design system › Badge (28:8237). Tone mirrors Figma's "Tone" property.

export type BadgeTone = "neutral" | "info" | "success" | "warning" | "error";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

const tones: Record<BadgeTone, string> = {
  neutral: "bg-canvas text-ink-3",
  info: "bg-blue-soft text-blue",
  success: "bg-status-success-soft text-success",
  warning: "bg-status-warning-soft text-status-warning",
  error: "bg-status-error-soft text-error",
};

export function Badge({
  tone = "neutral",
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cx(
        "inline-flex shrink-0 items-center gap-1 rounded-pill px-2 py-1 type-badge whitespace-nowrap",
        tones[tone],
        className,
      )}
      {...props}
    >
      <span
        aria-hidden
        className="size-badge-dot shrink-0 rounded-pill bg-current"
      />
      {children}
    </span>
  );
}
