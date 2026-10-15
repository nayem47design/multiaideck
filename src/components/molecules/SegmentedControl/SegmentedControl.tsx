import { ToggleGroup } from "radix-ui";

import { cx, focusRing } from "@/components/atoms/states";

// Figma: Design system › Segmented control (28:8312). Figma's Selected=First|Second is `value`.

export interface SegmentedOption {
  value: string;
  label: string;
}

export interface SegmentedControlProps {
  options: SegmentedOption[];
  value: string;
  onValueChange?: (value: string) => void;
  /** Accessible name for the group. */
  label: string;
  className?: string;
}

export function SegmentedControl({
  options,
  value,
  onValueChange,
  label,
  className,
}: SegmentedControlProps) {
  return (
    <ToggleGroup.Root
      type="single"
      value={value}
      onValueChange={(next) => next && onValueChange?.(next)}
      aria-label={label}
      className={cx(
        "inline-flex items-center gap-0-5 rounded-pill bg-canvas-deep p-1",
        className,
      )}
    >
      {options.map((option) => (
        <ToggleGroup.Item
          key={option.value}
          value={option.value}
          className={cx(
            "inline-flex h-segmented-option-height items-center rounded-pill px-3 type-segmented-option whitespace-nowrap text-ink-2",
            "transition-colors duration-base ease-out hover:text-ink",
            "data-[state=on]:bg-surface data-[state=on]:text-ink data-[state=on]:shadow-segmented-option",
            focusRing,
          )}
        >
          {option.label}
        </ToggleGroup.Item>
      ))}
    </ToggleGroup.Root>
  );
}
