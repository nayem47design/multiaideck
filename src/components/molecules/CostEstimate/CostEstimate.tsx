import type { HTMLAttributes } from "react";

import { Icon } from "@/components/atoms/Icon";
import { cx } from "@/components/atoms/states";

// Figma: Design system › Cost estimate (103:25116). Wrap in a Tooltip for the breakdown.

export function CostEstimate({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 type-cost-estimate text-ink-3",
        className,
      )}
      {...props}
    >
      {children}
      <Icon name="information-circle" className="size-cost-estimate-icon" />
    </span>
  );
}
