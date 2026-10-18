"use client";

import { RadioGroup } from "radix-ui";
import { useId } from "react";

import { cx, focusRing } from "@/components/atoms/states";

// Figma: M15 · Account & settings › Reading › Text size (166:22604): "Text size" with the current
// choice on the right, then five segments that each show the sample letter in the size it gives
// (10 / 12 / 14 / 16 / 19 px), so people see the difference before choosing.

export interface TextSizeOption {
  value: string;
  /** The option's name, e.g. "Extra small"; shown at the right of the label when chosen. */
  name: string;
}

export interface TextSizePickerProps {
  /** e.g. "Text size". */
  label: string;
  /** Five options, smallest first. */
  options: TextSizeOption[];
  /** The sample letter, e.g. "A" (Bangla: "অ"). */
  sample: string;
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
}

const SAMPLE = [
  "type-acct-text-size-xsmall",
  "type-acct-text-size-small",
  "type-acct-text-size-normal",
  "type-acct-text-size-large",
  "type-acct-text-size-larger",
];

export function TextSizePicker({
  label,
  options,
  sample,
  value,
  onValueChange,
  className,
}: TextSizePickerProps) {
  const labelId = useId();
  const current = options.find((o) => o.value === value);
  return (
    <div className={cx("flex flex-col gap-2", className)}>
      <div className="flex items-center justify-between gap-2">
        <p id={labelId} className="type-mobile-button text-ink">
          {label}
        </p>
        {current && (
          <p aria-hidden className="type-acct-text-size-current text-ink-2">
            {current.name}
          </p>
        )}
      </div>
      <RadioGroup.Root
        aria-labelledby={labelId}
        value={value}
        onValueChange={onValueChange}
        orientation="horizontal"
        className="flex h-acct-text-size-options-height items-center rounded-pill bg-canvas p-1"
      >
        {options.map((option, i) => (
          <RadioGroup.Item
            key={option.value}
            value={option.value}
            aria-label={option.name}
            className={cx(
              "flex h-acct-text-size-option-height min-w-0 flex-1 items-center justify-center rounded-pill text-ink-2",
              "transition-colors duration-fast ease-out hover:text-ink",
              "data-[state=checked]:bg-surface data-[state=checked]:text-ink",
              SAMPLE[i] ?? SAMPLE[2],
              focusRing,
            )}
          >
            <span aria-hidden>{sample}</span>
          </RadioGroup.Item>
        ))}
      </RadioGroup.Root>
    </div>
  );
}
