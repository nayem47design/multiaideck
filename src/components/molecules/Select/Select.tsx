import { Select as RadixSelect } from "radix-ui";

import { Icon } from "@/components/atoms/Icon";
import { cx, focusRing } from "@/components/atoms/states";

// Figma: Design system › Select (103:20625). Figma's State=Open is the open trigger. The option
// list is not in Figma; it is built from tokens (surface, line, shadow-float, radius md).

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps {
  options: SelectOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** Accessible name. */
  label: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export function Select({ options, label, className, ...props }: SelectProps) {
  return (
    <RadixSelect.Root {...props}>
      <RadixSelect.Trigger
        aria-label={label}
        className={cx(
          "group flex h-control-md w-full items-center gap-2 rounded-sm bg-surface px-3 type-select text-ink",
          "ring-1 ring-line ring-inset data-[state=open]:ring-(length:--select-border-open-width) data-[state=open]:ring-blue",
          focusRing,
          "disabled:cursor-not-allowed disabled:bg-canvas disabled:text-ink-3",
          className,
        )}
      >
        <span className="min-w-0 flex-1 truncate text-left">
          <RadixSelect.Value />
        </span>
        <Icon
          name="arrow-down-01"
          className="size-select-icon text-ink-3 group-data-[state=open]:hidden"
        />
        <Icon
          name="arrow-up-01"
          className="hidden size-select-icon text-ink-3 group-data-[state=open]:block"
        />
      </RadixSelect.Trigger>
      <RadixSelect.Portal>
        <RadixSelect.Content
          position="popper"
          sideOffset={4}
          className="z-50 min-w-(--radix-select-trigger-width) overflow-hidden rounded-md border border-line bg-surface p-1 shadow-float"
        >
          <RadixSelect.Viewport>
            {options.map((option) => (
              <RadixSelect.Item
                key={option.value}
                value={option.value}
                className="flex h-control-sm cursor-pointer items-center rounded-xs px-2 type-select text-ink outline-none data-highlighted:bg-canvas data-[state=checked]:text-blue"
              >
                <RadixSelect.ItemText>{option.label}</RadixSelect.ItemText>
              </RadixSelect.Item>
            ))}
          </RadixSelect.Viewport>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    </RadixSelect.Root>
  );
}
