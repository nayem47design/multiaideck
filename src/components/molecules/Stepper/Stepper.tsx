import { Icon } from "@/components/atoms/Icon";
import { cx, focusRing, stateLayer } from "@/components/atoms/states";

// Figma: Design system › Stepper (28:8344).

export interface StepperProps {
  value: number;
  onValueChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  /** What to show, e.g. "500 credits". */
  valueLabel: string;
  decreaseLabel: string;
  increaseLabel: string;
  className?: string;
}

const stepButton = cx(
  "inline-flex size-control-md items-center justify-center rounded-pill text-ink-2",
  stateLayer,
  focusRing,
  "disabled:cursor-not-allowed disabled:text-ink-3",
);

export function Stepper({
  value,
  onValueChange,
  min = -Infinity,
  max = Infinity,
  step = 1,
  valueLabel,
  decreaseLabel,
  increaseLabel,
  className,
}: StepperProps) {
  return (
    <div
      role="group"
      className={cx(
        "inline-flex h-control-md items-center rounded-pill border border-line bg-surface",
        className,
      )}
    >
      <button
        type="button"
        aria-label={decreaseLabel}
        disabled={value - step < min}
        onClick={() => onValueChange(Math.max(min, value - step))}
        className={stepButton}
      >
        <Icon name="minus-sign" className="size-stepper-icon" />
      </button>
      <output
        aria-live="polite"
        className="px-1-5 type-stepper whitespace-nowrap text-ink"
      >
        {valueLabel}
      </output>
      <button
        type="button"
        aria-label={increaseLabel}
        disabled={value + step > max}
        onClick={() => onValueChange(Math.min(max, value + step))}
        className={stepButton}
      >
        <Icon name="add-01" className="size-stepper-icon" />
      </button>
    </div>
  );
}
