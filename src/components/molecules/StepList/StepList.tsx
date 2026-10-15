import { Icon } from "@/components/atoms/Icon";
import { cx } from "@/components/atoms/states";

// Figma: Prototype › M34 · Finish payment in bKash › "Steps": numbered steps, done ones ticked.

export interface StepListProps {
  steps: { label: string; done?: boolean }[];
  /** Digits for the step numbers, e.g. Bangla digits; defaults to 1, 2, 3. */
  numbers?: string[];
  className?: string;
}

export function StepList({ steps, numbers, className }: StepListProps) {
  return (
    <ol
      className={cx(
        "flex flex-col gap-3 rounded-lg border border-line bg-surface p-4",
        className,
      )}
    >
      {steps.map((step, i) => (
        <li key={step.label} className="flex items-center gap-3">
          <span
            className={cx(
              "flex size-m-step shrink-0 items-center justify-center rounded-pill",
              step.done
                ? "bg-success text-on-cta"
                : "bg-canvas type-go-pro-button text-ink-2",
            )}
          >
            {step.done ? (
              <Icon name="tick-02" className="size-icon-sm" />
            ) : (
              (numbers?.[i] ?? String(i + 1))
            )}
          </span>
          <span
            className={cx(
              "type-m-step-label",
              step.done ? "text-ink" : "text-ink-2",
            )}
          >
            {step.label}
          </span>
        </li>
      ))}
    </ol>
  );
}
