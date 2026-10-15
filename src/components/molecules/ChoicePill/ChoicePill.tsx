import type { ButtonHTMLAttributes, Ref } from "react";

import { cx, focusRing, stateLayer } from "@/components/atoms/states";

// Figma: the pills on the Chats filters ("Filter · All") and Image studio styles ("Style · Photo").
// They differ from the Filter pill component (28:8219): 34px tall (40 in M21), selected is
// lum/blue-soft with a lum/blue stroke, unselected is lum/surface with lum/line. `size="lg"` is the
// M21 picture sheet. Listed for the designer.

export type ChoicePillSize = "md" | "lg";

export interface ChoicePillProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
  size?: ChoicePillSize;
  ref?: Ref<HTMLButtonElement>;
}

const sizes: Record<ChoicePillSize, string> = {
  md: "h-choice-pill-h px-choice-pill-pad type-choice-pill",
  lg: "h-choice-pill-h-lg px-4 type-choice-pill-lg",
};

export function ChoicePill({
  selected = false,
  size = "md",
  type = "button",
  className,
  ref,
  ...props
}: ChoicePillProps) {
  return (
    <button
      ref={ref}
      type={type}
      aria-pressed={selected}
      className={cx(
        "inline-flex shrink-0 items-center rounded-pill whitespace-nowrap ring-1 ring-inset",
        "transition-colors duration-fast ease-out",
        stateLayer,
        focusRing,
        "disabled:cursor-not-allowed disabled:text-ink-3",
        selected
          ? "bg-blue-soft text-blue ring-blue"
          : "bg-surface text-ink ring-line",
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}
