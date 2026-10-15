import { Button } from "@/components/atoms/Button";
import { Icon } from "@/components/atoms/Icon";
import { cx } from "@/components/atoms/states";

// Figma: Prototype › M11 · Add credits › "Pay bar": what you get, the new balance, the pay button
// and the PayStation note, docked at the bottom of the screen.

export interface MobilePayBarProps {
  /** e.g. "You get 76,890 credits". */
  summary: string;
  /** e.g. "New balance 87,574". */
  detail?: string;
  payLabel: string;
  onPay?: () => void;
  disabled?: boolean;
  /** e.g. "Secured by PayStation · failed payments are never charged". */
  note: string;
  className?: string;
}

export function MobilePayBar({
  summary,
  detail,
  payLabel,
  onPay,
  disabled,
  note,
  className,
}: MobilePayBarProps) {
  return (
    <div
      className={cx(
        "flex flex-col gap-m-content-gap-sm border-t border-line bg-surface px-4 py-m-pay-bar-pad-y",
        className,
      )}
    >
      <p className="flex items-center justify-between gap-3">
        <span className="type-m-row-title text-ink">{summary}</span>
        {detail && <span className="type-ui text-ink-2">{detail}</span>}
      </p>
      <Button
        size="touch-lg"
        className="w-full"
        onClick={onPay}
        disabled={disabled}
      >
        {payLabel}
      </Button>
      <p className="flex items-center justify-center gap-1-5 text-center type-caption text-ink-2">
        <Icon name="square-lock-02" className="size-m-chip-icon shrink-0" />
        {note}
      </p>
    </div>
  );
}
