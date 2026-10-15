import type { ReactNode } from "react";

import { cx } from "@/components/atoms/states";

// Figma: Design system › Template/Full page with checkout (28:9384), drawn at 0.75 scale of
// 1440×900. Page top bar; summary cards; then "choose amount + pay with" beside the order summary.

export interface CheckoutShellProps {
  topBar: ReactNode;
  summary: ReactNode;
  /** Choose amount + pay with. */
  children: ReactNode;
  orderSummary: ReactNode;
  className?: string;
}

export function CheckoutShell({
  topBar,
  summary,
  children,
  orderSummary,
  className,
}: CheckoutShellProps) {
  return (
    <div
      className={cx("flex min-h-dvh flex-col bg-canvas p-shell-pad", className)}
    >
      <div data-region="top-bar">{topBar}</div>
      <div className="mx-auto mt-page-top flex w-full max-w-page-width flex-col gap-checkout-row-gap">
        <div data-region="summary">{summary}</div>
        <div className="flex items-start gap-checkout-col-gap">
          <div
            data-region="main"
            className="flex w-checkout-main-width min-w-0 flex-col gap-4"
          >
            {children}
          </div>
          <div
            data-region="order-summary"
            className="sticky top-shell-pad w-order-summary-width shrink-0"
          >
            {orderSummary}
          </div>
        </div>
      </div>
    </div>
  );
}
