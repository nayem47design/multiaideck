import type { ButtonHTMLAttributes, Ref } from "react";

import { cx, focusRing, stateLayer } from "../states";

// Figma: Design system › Filter pill (28:8219). `selected` is Figma's State=Selected.

export interface FilterPillProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
  ref?: Ref<HTMLButtonElement>;
}

export function FilterPill({
  selected = false,
  type = "button",
  className,
  ref,
  ...props
}: FilterPillProps) {
  return (
    <button
      ref={ref}
      type={type}
      aria-pressed={selected}
      className={cx(
        "inline-flex h-filter-pill-height shrink-0 items-center rounded-pill px-3 type-filter-pill whitespace-nowrap",
        "transition-colors duration-fast ease-out",
        stateLayer,
        focusRing,
        "disabled:cursor-not-allowed disabled:text-ink-3",
        selected ? "bg-ink text-on-cta" : "border border-line text-ink-2",
        className,
      )}
      {...props}
    />
  );
}
