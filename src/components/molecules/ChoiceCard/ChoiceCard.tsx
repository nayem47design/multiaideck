import { RadioGroup } from "radix-ui";
import type { ReactNode } from "react";

import { Icon } from "@/components/atoms/Icon";
import { cx, focusRing } from "@/components/atoms/states";

// Not a Figma component yet: the big radio cards in mobile sheets: "Mode · Best answer" (M7) and
// "Choice · All 3 AIs" (M9). Selected: blue-soft with a 1.5px blue border and a filled check.
// Use inside <ChoiceGroup> (a Radix radio group).

export interface ChoiceCardProps {
  value: string;
  title: string;
  /** e.g. a "Recommended" tag after the title. */
  tag?: string;
  description: string;
  /** e.g. "About 3 credits (৳0.03)". */
  footnote?: string;
  /** Leading visual, e.g. model orbs. */
  leading?: ReactNode;
  className?: string;
}

export function ChoiceCard({
  value,
  title,
  tag,
  description,
  footnote,
  leading,
  className,
}: ChoiceCardProps) {
  return (
    <RadioGroup.Item
      value={value}
      className={cx(
        "group flex w-full items-start gap-3 rounded-chat-m-choice p-chat-m-choice-pad text-left ring-inset",
        "bg-surface ring-1 ring-line",
        "data-[state=checked]:bg-blue-soft data-[state=checked]:ring-(length:--chat-m-selected-width) data-[state=checked]:ring-blue",
        "transition-colors duration-fast ease-out",
        focusRing,
        className,
      )}
    >
      {leading && <span className="flex shrink-0 pt-0-5">{leading}</span>}
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="type-chat-m-name text-ink">{title}</span>
          {tag && (
            <span className="inline-flex h-chat-m-tag items-center rounded-pill bg-surface px-2 type-caption text-blue">
              {tag}
            </span>
          )}
        </span>
        <span className="type-ui text-ink-2">{description}</span>
        {footnote && (
          <span className="type-ui-strong text-ink">{footnote}</span>
        )}
      </span>
      <span
        aria-hidden
        className={cx(
          "flex size-6 shrink-0 items-center justify-center rounded-pill",
          "border-(length:--chat-m-radio-width) border-line group-data-[state=checked]:border-0 group-data-[state=checked]:bg-blue",
        )}
      >
        <Icon
          name="tick-02"
          className="hidden size-icon-sm text-on-cta group-data-[state=checked]:block"
        />
      </span>
    </RadioGroup.Item>
  );
}

export interface ChoiceGroupProps {
  value: string;
  onValueChange: (value: string) => void;
  /** Accessible name, e.g. "How should we answer?". */
  label: string;
  children: ReactNode;
  className?: string;
}

export function ChoiceGroup({
  value,
  onValueChange,
  label,
  children,
  className,
}: ChoiceGroupProps) {
  return (
    <RadioGroup.Root
      value={value}
      onValueChange={onValueChange}
      aria-label={label}
      className={cx("flex flex-col gap-3", className)}
    >
      {children}
    </RadioGroup.Root>
  );
}
