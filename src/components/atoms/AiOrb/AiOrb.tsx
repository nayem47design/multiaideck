import type { HTMLAttributes } from "react";

import { cx } from "../states";

// Figma: Design system › AI orb (28:8289). Decorative.

export interface AiOrbProps extends HTMLAttributes<HTMLSpanElement> {
  /** Replaces the default size (a size-* class), where Figma resizes the instance (e.g. Sidebar). */
  sizeClassName?: string;
}

export function AiOrb({ sizeClassName, className, ...props }: AiOrbProps) {
  return (
    <span
      aria-hidden
      className={cx(
        "block shrink-0 rounded-pill bg-(image:--ai-orb-fill) bg-origin-border",
        "ring-(length:--ai-orb-ring-width) ring-ai-orb-ring ring-inset",
        sizeClassName ?? "size-ai-orb-size",
        className,
      )}
      {...props}
    />
  );
}
