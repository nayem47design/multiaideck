import type { HTMLAttributes } from "react";

import { Icon } from "../Icon/Icon";
import { cx } from "../states";

// Figma: Design system › Payment logo slot (103:20611), 36px. bKash and Nagad show the providers'
// logos (Design system › Brand logos › Payment logo, 276:52024; public/logos/payment) on a white
// tile with a hairline ring, white in both themes so the artwork stays legible. Card shows the
// card icon. Screens scale the slot (Checkout dialog 56px, M34 72px): pass sizeClassName and a
// matching radius in className; the logo keeps Figma's proportion (30 of 36px wide).

export type PaymentMethod = "bkash" | "nagad" | "card";

export interface PaymentLogoSlotProps extends HTMLAttributes<HTMLSpanElement> {
  method: PaymentMethod;
  /** The method's name, read by screen readers. Pass "" when the name sits next to it. */
  label: string;
  /** A size-* class; Figma's is 36px (size-control-md). */
  sizeClassName?: string;
}

export function PaymentLogoSlot({
  method,
  label,
  sizeClassName = "size-control-md",
  className,
  ...props
}: PaymentLogoSlotProps) {
  const logo = method !== "card";
  return (
    <span
      role={label ? "img" : undefined}
      aria-label={label || undefined}
      aria-hidden={label ? undefined : true}
      className={cx(
        "inline-flex shrink-0 items-center justify-center rounded-sm",
        logo
          ? "bg-payment-logo-tile ring-1 ring-line ring-inset"
          : "bg-canvas text-ink-2",
        sizeClassName,
        className,
      )}
      {...props}
    >
      {logo ? (
        // eslint-disable-next-line @next/next/no-img-element -- static brand artwork, sized by CSS
        <img
          src={`/logos/payment/${method}.svg`}
          alt=""
          width={300}
          height={137}
          decoding="async"
          draggable={false}
          // Figma: the logo is 30px wide in the 36px slot.
          className="h-auto w-[83.333%] select-none"
        />
      ) : (
        <Icon name="credit-card" className="size-payment-logo-icon" />
      )}
    </span>
  );
}
