import type { ButtonHTMLAttributes, Ref } from "react";

import { Icon, type IconName } from "../Icon/Icon";
import { cx, focusRing, stateLayer } from "../states";

// Figma: Design system › Icon button (28:8212). Variant mirrors Figma's "Style" property.

export type IconButtonVariant = "plain" | "outline" | "glass" | "send" | "stop";

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: IconButtonVariant;
  /** Figma "Icon" swap. Send and Stop default to their Figma icons. */
  icon?: IconName;
  /** Accessible name; the button shows no text. */
  label: string;
  ref?: Ref<HTMLButtonElement>;
}

const DEFAULT_ICON: Record<IconButtonVariant, IconName> = {
  plain: "add-01",
  outline: "add-01",
  glass: "add-01",
  send: "arrow-up-02",
  stop: "stop",
};

const variants: Record<IconButtonVariant, string> = {
  plain: "size-control-md text-ink-2",
  outline: "size-control-md border border-line text-ink-2",
  glass: "size-control-md border border-glass-rim text-ink-2 glass-strong",
  send: "size-control-lg bg-cta text-on-cta",
  stop: "size-control-lg bg-cta text-on-cta",
};

export function IconButton({
  variant = "plain",
  icon,
  label,
  type = "button",
  className,
  ref,
  ...props
}: IconButtonProps) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={label}
      className={cx(
        "inline-flex shrink-0 items-center justify-center rounded-pill",
        stateLayer,
        focusRing,
        "disabled:cursor-not-allowed disabled:text-ink-3",
        variants[variant],
        className,
      )}
      {...props}
    >
      <Icon
        name={icon ?? DEFAULT_ICON[variant]}
        className="size-icon-button-icon"
      />
    </button>
  );
}
