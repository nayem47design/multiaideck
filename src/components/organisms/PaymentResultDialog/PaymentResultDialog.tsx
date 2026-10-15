import { Button } from "@/components/atoms/Button";

import { HeroDialogPanel } from "../CheckoutDialog/HeroDialog";

// Figma: Design system › Payment result dialog (103:21324). Result mirrors Figma.

export type PaymentResult = "received" | "failed";

export interface PaymentResultDialogProps {
  result: PaymentResult;
  title: string;
  body: string;
  /** Received only. */
  summary?: { label: string; value: string; text?: boolean }[];
  primaryLabel: string;
  secondaryLabel: string;
  onPrimary?: () => void;
  onSecondary?: () => void;
}

export function PaymentResultDialogPanel({
  result,
  title,
  body,
  summary,
  primaryLabel,
  secondaryLabel,
  onPrimary,
  onSecondary,
}: PaymentResultDialogProps) {
  return (
    <HeroDialogPanel
      icon={result === "received" ? "tick-02" : "cancel-01"}
      tone={result === "received" ? "success" : "error"}
      title={title}
      body={body}
      summary={result === "received" ? summary : undefined}
      actions={
        <>
          <Button className="w-full" onClick={onPrimary}>
            {primaryLabel}
          </Button>
          <Button variant="secondary" className="w-full" onClick={onSecondary}>
            {secondaryLabel}
          </Button>
        </>
      }
    />
  );
}
