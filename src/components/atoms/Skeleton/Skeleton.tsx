import type { HTMLAttributes } from "react";

import { cx } from "../states";

// Figma: Design system › Skeleton (298:56113). Still placeholders in canvas-deep, as in Figma.
// Lines: 240 / 200 / 140 of 240 = full, 5/6, 7/12. Row: a chat or project row (36px orb, two
// lines, trailing meta). Table row: Usage and Payments rows. Card: a Presets card. Tile: an
// Image studio picture.

export type SkeletonVariant = "lines" | "row" | "table-row" | "card" | "tile";

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: SkeletonVariant;
  /** Lines only. */
  lines?: number;
}

const WIDTHS = ["w-full", "w-5/6", "w-7/12"];
const bar =
  "block h-skeleton-line shrink-0 rounded-skeleton-line bg-canvas-deep";

export function Skeleton({
  variant = "lines",
  lines = 3,
  className,
  ...props
}: SkeletonProps) {
  if (variant === "row")
    return (
      <div
        aria-hidden
        className={cx("flex w-full items-center gap-3 p-3", className)}
        {...props}
      >
        <span className="block size-control-md shrink-0 rounded-pill bg-canvas-deep" />
        <span className="flex flex-1 flex-col gap-2">
          <span className={cx(bar, "w-2/5")} />
          <span className={cx(bar, "w-1/4")} />
        </span>
        <span className={cx(bar, "w-14")} />
      </div>
    );
  if (variant === "table-row")
    return (
      <div
        aria-hidden
        className={cx("flex w-full items-center gap-6 px-6 py-5", className)}
        {...props}
      >
        <span className={cx(bar, "w-1/6")} />
        <span className={cx(bar, "flex-1")} />
        <span className={cx(bar, "w-1/6")} />
        <span className={cx(bar, "w-1/8")} />
        <span className={cx(bar, "w-1/12")} />
      </div>
    );
  if (variant === "card")
    return (
      <div
        aria-hidden
        className={cx(
          "flex aspect-[2/1] w-full flex-col gap-3 rounded-lg border border-line bg-surface p-6",
          className,
        )}
        {...props}
      >
        <span className={cx(bar, "w-2/5")} />
        <span className={cx(bar, "w-2/3")} />
        <span className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="block size-control-sm rounded-pill bg-canvas-deep"
            />
          ))}
        </span>
        <span className="flex-1" />
        <span className={cx(bar, "w-1/3")} />
      </div>
    );
  if (variant === "tile")
    return (
      <div
        aria-hidden
        className={cx(
          "aspect-square w-full rounded-images-tile bg-canvas-deep",
          className,
        )}
        {...props}
      />
    );
  return (
    <div
      aria-hidden
      className={cx("flex flex-col gap-2", className)}
      {...props}
    >
      {Array.from({ length: lines }, (_, i) => (
        <span key={i} className={cx(bar, WIDTHS[i % WIDTHS.length])} />
      ))}
    </div>
  );
}
