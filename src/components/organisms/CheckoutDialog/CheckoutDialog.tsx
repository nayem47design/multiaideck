import { Button } from "@/components/atoms/Button";

import { HeroDialogPanel } from "./HeroDialog";

// Figma: Design system › Checkout dialog (103:21288): waiting for the person to approve the
// payment in their bKash / Nagad app.

export interface CheckoutDialogProps {
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
