import type { HTMLAttributes } from "react";

import { cx } from "../states";

// Figma: Design system › Avatar (28:8270).

export interface AvatarProps extends HTMLAttributes<HTMLSpanElement> {
  /** The person's initials, e.g. from their name. */
  initials: string;
  /** The person's name, read by screen readers. */
  name: string;
}

export function Avatar({ initials, name, className, ...props }: AvatarProps) {
  return (
    <span
      role="img"
      aria-label={name}
      className={cx(
        "inline-flex size-avatar-size shrink-0 items-center justify-center rounded-pill bg-blue-soft type-avatar text-blue select-none",
        className,
      )}
      {...props}
    >
      <span aria-hidden>{initials}</span>
    </span>
  );
}
