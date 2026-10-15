import type { AnchorHTMLAttributes } from "react";

import { cx, focusRing } from "@/components/atoms/states";

// Figma: Design system › Citation chip (103:20626). A link to a source.

export function CitationChip({
  className,
  children,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a
      className={cx(
        "inline-flex h-citation-chip-height items-center gap-1-5 rounded-pill border border-line bg-surface px-2 type-citation-chip whitespace-nowrap text-ink-2",
        "transition-colors duration-fast ease-out hover:text-ink",
        focusRing,
        className,
      )}
      {...props}
    >
      <span
        aria-hidden
        className="size-citation-chip-dot shrink-0 rounded-pill bg-blue"
      />
      {children}
    </a>
  );
}
