import type { HTMLAttributes } from "react";

import { cx } from "../states";

// Figma: Design system › Shortcut chip (103:20587).

export function ShortcutChip({
  className,
  ...props
}: HTMLAttributes<HTMLElement>) {
  return (
    <kbd
      className={cx(
        "inline-flex shrink-0 items-start rounded-shortcut-chip border border-line px-1-5 py-0-5 type-shortcut-chip text-ink-3",
        className,
      )}
      {...props}
    />
  );
}
