import type { InputHTMLAttributes, Ref } from "react";

import { Icon } from "@/components/atoms/Icon";
import { ShortcutChip } from "@/components/atoms/ShortcutChip";
import { cx } from "@/components/atoms/states";

// Figma: Design system › Search field (28:8313). The Figma frame is 300px; this fills its container.

export interface SearchFieldProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type"
> {
  /** Keyboard shortcut shown on the right, e.g. "⌘K". */
  shortcut?: string;
  ref?: Ref<HTMLInputElement>;
}

export function SearchField({
  shortcut,
  className,
  ref,
  ...props
}: SearchFieldProps) {
  return (
    <label
      className={cx(
        "flex h-10 w-full items-center gap-2 rounded-pill px-4 text-ink-3",
        "ring-1 ring-line ring-inset focus-within:ring-(length:--input-border-focus-width) focus-within:ring-blue",
        className,
      )}
    >
      <Icon name="search-01" className="size-icon-sm" />
      <input
        ref={ref}
        type="search"
        className="min-w-0 flex-1 bg-transparent type-search-field text-ink outline-none placeholder:text-ink-3"
        {...props}
      />
      {shortcut && <ShortcutChip>{shortcut}</ShortcutChip>}
    </label>
  );
}
