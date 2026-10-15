import { Progress } from "radix-ui";
import type { ComponentProps } from "react";

import { cx } from "../states";

// Figma: Design system › Progress bar (103:20579). Figma's State picks the fill colour.

export type ProgressBarState = "in-progress" | "done" | "near-limit";

export interface ProgressBarProps extends Omit<
  ComponentProps<typeof Progress.Root>,
  "asChild"
> {
  /** 0–100. */
  value: number;
  state?: ProgressBarState;
}

const fills: Record<ProgressBarState, string> = {
  "in-progress": "bg-blue",
  done: "bg-success",
  "near-limit": "bg-status-warning-bar",
};

export function ProgressBar({
  value,
  state = "in-progress",
  className,
  ...props
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <Progress.Root
      value={clamped}
      className={cx(
        "h-progress-height w-full overflow-hidden rounded-pill bg-blue-soft",
        className,
      )}
      {...props}
    >
      <Progress.Indicator
        className={cx(
          "h-full rounded-pill transition-[width] duration-slow ease-out",
          fills[state],
        )}
        style={{ width: `${clamped}%` }}
      />
    </Progress.Root>
  );
}
