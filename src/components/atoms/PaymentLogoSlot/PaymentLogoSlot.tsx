import type { HTMLAttributes } from "react";

import { Icon, type IconName } from "../Icon/Icon";
import { cx } from "../states";

// Figma: Design system › Payment logo slot (103:20611). Figma uses placeholder icons for
// bKash and Nagad; swap in the real logos when the designer adds them.

export type PaymentMethod = "bkash" | "nagad" | "card";

export interface PaymentLogoSlotProps extends HTMLAttributes<HTMLSpanElement> {
  method: PaymentMethod;
  /** The method's name, read by screen readers. */
  label: string;
}

const ICONS: Record<PaymentMethod, IconName> = {
  bkash: "smart-phone-01",
  nagad: "smart-phone-01",
  card: "credit-card",
};

export function PaymentLogoSlot({
  method,
  label,
  className,
  ...props
}: PaymentLogoSlotProps) {
  return (
    <span
      role="img"
      aria-label={label}
      className={cx(
        "inline-flex size-control-md shrink-0 items-center justify-center rounded-sm bg-canvas text-ink-2",
        className,
      )}
      {...props}
    >
      <Icon name={ICONS[method]} className="size-payment-logo-icon" />
    </span>
  );
}
