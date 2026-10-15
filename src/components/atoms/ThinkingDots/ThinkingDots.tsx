import type { HTMLAttributes } from "react";

import { cx } from "../states";

// Figma: Design system › Thinking dots (103:20563). Figma shows the dots still at
// 100 / 60 / 30% opacity; the wave animation is added in code (reduced motion: still).

export interface ThinkingDotsProps extends HTMLAttributes<HTMLSpanElement> {
  /** Announced to screen readers, e.g. "Thinking". */
  label: string;
}

const dot =
  "size-thinking-dot shrink-0 rounded-pill bg-blue motion-safe:animate-thinking-dot";

export function ThinkingDots({
  label,
  className,
  ...props
}: ThinkingDotsProps) {
  return (
    <span
      role="status"
      aria-label={label}
      className={cx("inline-flex items-center gap-1", className)}
      {...props}
    >
      <span className={dot} />
      <span
        className={cx(
          dot,
          "opacity-(--thinking-dot-2) [animation-delay:calc(var(--duration-ambient)/6)]",
        )}
      />
      <span
        className={cx(
          dot,
          "opacity-(--thinking-dot-3) [animation-delay:calc(var(--duration-ambient)/3)]",
        )}
      />
    </span>
  );
}
