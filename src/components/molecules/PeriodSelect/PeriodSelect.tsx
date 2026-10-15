"use client";

import { Select } from "radix-ui";

import { Icon } from "@/components/atoms/Icon";
import { cx, focusRing } from "@/components/atoms/states";

// Figma: Prototype › Settings · Usage › "Period" (34px pill with a calendar icon) and M13 · Usage ›
// Top bar › "Period" (40px, no icon, below 768px). The option list is not in Figma; it uses the
// Select molecule's list style.

export interface PeriodOption {
  value: string;
  label: string;
}

export interface PeriodSelectProps {
  options: PeriodOption[];
  value: string;
  onValueChange: (value: string) => void;
  /** Accessible name, e.g. "Period". */
  label: string;
  className?: string;
}

export function PeriodSelect({
  options,
  value,
  onValueChange,
  label,
  className,
}: PeriodSelectProps) {
  return (
    <Select.Root value={value} onValueChange={onValueChange}>
      <Select.Trigger
        aria-label={label}
        className={cx(
          "group inline-flex h-acct-period-height shrink-0 items-center gap-1 rounded-pill border border-line bg-surface px-3 text-ink",
          "md:h-usage-period-height md:gap-1-5",
          "transition-colors duration-fast ease-out hover:bg-canvas data-[state=open]:border-blue",
          focusRing,
          className,
        )}
      >
        <Icon
          name="calendar-03"
          className="hidden size-icon-sm text-ink-2 md:block"
        />
        <span className="type-ui-strong md:type-settings-link">
          <Select.Value />
        </span>
        <Icon
          name="arrow-down-01"
          className="size-icon-sm text-ink-3 group-data-[state=open]:rotate-180 md:size-select-icon"
        />
      </Select.Trigger>
      <Select.Portal>
        <Select.Content
          position="popper"
          sideOffset={4}
          align="end"
          className="z-50 min-w-(--radix-select-trigger-width) overflow-hidden rounded-md border border-line bg-surface p-1 shadow-float"
        >
          <Select.Viewport>
            {options.map((option) => (
              <Select.Item
                key={option.value}
                value={option.value}
                className="flex h-control-md cursor-pointer items-center rounded-xs px-2 type-select text-ink outline-none data-highlighted:bg-canvas data-[state=checked]:text-blue"
              >
                <Select.ItemText>{option.label}</Select.ItemText>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}
