import type { HTMLAttributes } from "react";

import { cx } from "../states";

// Figma: Design system › Metric chip (28:8285). Mono so numbers line up.

export function MetricChip({
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cx(
        "inline-flex shrink-0 items-start rounded-pill bg-canvas px-2 py-1 type-metric-chip whitespace-nowrap text-ink-2",
        className,
      )}
      {...props}
    />
  );
}
