import { Button } from "@/components/atoms/Button";
import {
  PaymentLogoSlot,
  type PaymentMethod,
} from "@/components/atoms/PaymentLogoSlot";

import { HeroDialogPanel } from "./HeroDialog";

// Figma: Design system › Checkout dialog (103:21288): waiting for the person to approve the
// payment in their bKash / Nagad app. The provider's logo tile (Payment logo slot at 56px) heads it;
// a card payment keeps the phone icon.

export interface CheckoutDialogProps {
  /** Which app the person approves in; bKash and Nagad show their logo. */
  method?: PaymentMethod;
  head: string;
  title: string;
  body: string;
  summary: { label: string; value: string; text?: boolean }[];
  approvedLabel: string;
  /** Sandbox only, e.g. "Simulate a failed payment". */
  simulateFailureLabel?: string;
  cancelLabel: string;
  onApproved?: () => void;
  onSimulateFailure?: () => void;
  onCancel?: () => void;
}

export function CheckoutDialogPanel({
  method,
  head,
  title,
  body,
  summary,
  approvedLabel,
  simulateFailureLabel,
  cancelLabel,
  onApproved,
  onSimulateFailure,
  onCancel,
}: CheckoutDialogProps) {
  return (
    <HeroDialogPanel
      head={{ icon: "square-lock-02", label: head }}
      icon="smart-phone-01"
      media={
        method && method !== "card" ? (
          <PaymentLogoSlot
            method={method}
            label=""
            sizeClassName="size-14"
            className="rounded-md"
          />
        ) : undefined
      }
      tone="info"
      title={title}
      body={body}
      summary={summary}
      actions={
        <>
          <Button className="w-full" onClick={onApproved}>
            {approvedLabel}
          </Button>
          {simulateFailureLabel && (
            <Button
              variant="ghost"
              className="w-full"
              onClick={onSimulateFailure}
            >
              {simulateFailureLabel}
            </Button>
          )}
          <Button variant="secondary" className="w-full" onClick={onCancel}>
            {cancelLabel}
          </Button>
        </>
      }
    />
  );
}
