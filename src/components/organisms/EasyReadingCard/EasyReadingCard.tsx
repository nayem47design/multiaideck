"use client";

import { RadioGroup } from "radix-ui";
import { useId } from "react";

import { cx, focusRing } from "@/components/atoms/states";

// Figma: Prototype › M15 · Account & settings › "Reading": the text size picker. Each option is
// drawn in the size it gives (14, 16 and 19px), so people can see the difference before choosing.

export interface EasyReadingOption {
  value: string;
  label: string;
}

export interface EasyReadingCardProps {
  /** e.g. "Easy reading". */
  title: string;
  /** e.g. "Text size". */
  label: string;
  /** Three options, smallest first. */
  options: EasyReadingOption[];
  value: string;
  onValueChange: (value: string) => void;
  help: string;
  className?: string;
}

const optionText = [
  "type-acct-text-size-normal",
  "type-acct-row-label",
  "type-acct-text-size-larger",
];

export function EasyReadingCard({
  title,
  label,
  options,
  value,
  onValueChange,
  help,
  className,
}: EasyReadingCardProps) {
  const labelId = useId();
  return (
    <section
      className={cx(
        "flex flex-col gap-3 rounded-lg border border-line bg-surface p-acct-card-pad",
        className,
      )}
    >
      <h2 className="type-ui-strong text-ink-2">{title}</h2>
      <div className="flex flex-col gap-2">
        <p id={labelId} className="type-acct-row-label text-ink">
          {label}
        </p>
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
              className={cx(
                "flex h-acct-text-size-option-height min-w-0 flex-1 items-center justify-center rounded-pill text-ink-2",
                "transition-colors duration-fast ease-out hover:text-ink",
                "data-[state=checked]:bg-surface data-[state=checked]:text-ink",
                optionText[i] ?? optionText[0],
                focusRing,
              )}
            >
              {option.label}
            </RadioGroup.Item>
          ))}
        </RadioGroup.Root>
      </div>
      <p className="type-ui text-ink-2">{help}</p>
    </section>
  );
}
