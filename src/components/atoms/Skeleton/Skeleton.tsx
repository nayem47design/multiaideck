import type { HTMLAttributes } from "react";

import { cx } from "../states";

// Figma: Design system › Skeleton (103:20580). Line widths follow Figma: 240 / 200 / 140
// of 240 = full, 5/6, 7/12. Still, as in Figma.

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  lines?: number;
}

const WIDTHS = ["w-full", "w-5/6", "w-7/12"];

export function Skeleton({ lines = 3, className, ...props }: SkeletonProps) {
  return (
    <div
      aria-hidden
      className={cx("flex flex-col gap-2", className)}
      {...props}
    >
      {Array.from({ length: lines }, (_, i) => (
        <span
          key={i}
          className={cx(
            "block h-skeleton-line rounded-skeleton-line bg-canvas-deep",
            WIDTHS[i % WIDTHS.length],
          )}
        />
      ))}
    </div>
  );
}
