import type { ButtonHTMLAttributes, Ref } from "react";

import { cx, focusRing, stateLayer } from "../states";

// Figma: Design system › Button (28:8200). Variant × Size mirror the Figma properties.
// Hover, pressed, focus, disabled and loading are not in Figma yet; they are built from
// tokens here and listed for the designer.

export type ButtonVariant =
  "primary" | "secondary" | "ghost" | "destructive" | "tinted";
export type ButtonSize = "md" | "sm";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Shows a spinner, keeps the button's width and blocks clicks. */
  loading?: boolean;
  ref?: Ref<HTMLButtonElement>;
}

const base = [
  "inline-flex shrink-0 items-center justify-center gap-1-5 whitespace-nowrap",
  "rounded-pill select-none",
  "transition-colors duration-fast ease-out",
  stateLayer,
  focusRing,
  "disabled:cursor-not-allowed aria-busy:cursor-wait",
].join(" ");

const variants: Record<ButtonVariant, string> = {
  primary: "bg-cta text-on-cta",
  secondary: "border border-line bg-surface text-ink",
  ghost: "bg-transparent text-ink-2 enabled:hover:text-ink",
  destructive: "bg-error text-on-cta",
  tinted: "border border-blue bg-blue-soft text-blue",
};

// Disabled uses the muted tokens for every variant, rather than lowering opacity,
// so it reads the same on any background. Loading keeps the variant colours.
const disabledStyles = "[&:disabled:not([aria-busy=true])]:text-ink-3";
const disabledFillStyles =
  "[&:disabled:not([aria-busy=true])]:border-transparent [&:disabled:not([aria-busy=true])]:bg-canvas-deep";

const sizes: Record<ButtonSize, string> = {
  md: "h-control-lg px-5 type-ui-strong",
  sm: "h-control-md px-4 type-label",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  type = "button",
  className,
  children,
  ref,
  ...props
}: ButtonProps) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cx(
        base,
        variants[variant],
        disabledStyles,
        variant !== "ghost" && disabledFillStyles,
        sizes[size],
        className,
      )}
      {...props}
    >
      <span className={loading ? "invisible" : "contents"}>{children}</span>
      {loading && (
        <span
          aria-hidden
          className="absolute inset-0 flex items-center justify-center"
        >
          <span className="size-icon-sm animate-[spin_var(--duration-ambient)_linear_infinite] rounded-pill border-2 border-current border-r-transparent motion-reduce:animate-none" />
        </span>
      )}
    </button>
  );
}
