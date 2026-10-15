import type { ButtonHTMLAttributes, Ref } from "react";

import { Icon, type IconName } from "../Icon/Icon";
import { cx, focusRing, stateLayer } from "../states";

// Figma: Design system › Button (28:8200). Variant × Size mirror the Figma properties.
// Hover, pressed, focus, disabled and loading are not in Figma yet; they are built from
// tokens here and listed for the designer.

export type ButtonVariant =
  "primary" | "secondary" | "ghost" | "destructive" | "tinted";
export type ButtonSize = "md" | "sm" | "lg" | "touch" | "touch-lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Shows a spinner, keeps the button's width and blocks clicks. */
  loading?: boolean;
  /**
   * Leading icon. Not a Figma Button property, but organisms use the Button with an icon (e.g.
   * "Change photo", "Download"); Figma's Button gap (space/1-5) is the icon gap.
   */
  icon?: IconName;
  /** sm = 14px, md = 16px, lg = 20px (mobile buttons). */
  iconSize?: "sm" | "md" | "lg";
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
  /** 48px dialog buttons (Overlay · Go Pro, Pro is on). */
  lg: "h-12 px-go-pro-button-pad type-go-pro-button",
  /** 52px mobile button (M10 Add credits, secondary actions on M-screens). */
  touch: "h-m-button-h px-5 type-m-button",
  /** 56px mobile primary button (M11 Pay, M12 Start asking). */
  "touch-lg": "h-m-button-lg-h px-5 type-m-button",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  iconSize = "md",
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
      <span className={loading ? "invisible" : "contents"}>
        {icon && (
          <Icon
            name={icon}
            className={cx(
              iconSize === "sm"
                ? "size-select-icon"
                : iconSize === "lg"
                  ? "size-icon-md"
                  : "size-icon-sm",
              (variant === "secondary" || variant === "ghost") && "text-ink-2",
            )}
          />
        )}
        {children}
      </span>
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
