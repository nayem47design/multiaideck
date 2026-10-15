import type { HTMLAttributes } from "react";

import { cx } from "../states";

// Figma: Design system › AI orb (28:8289). Decorative.

export function AiOrb({
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      aria-hidden
      className={cx(
        "block size-ai-orb-size shrink-0 rounded-pill bg-(image:--ai-orb-fill) bg-origin-border",
        "ring-(length:--ai-orb-ring-width) ring-ai-orb-ring ring-inset",
        className,
      )}
      {...props}
    />
  );
}
