import { RadioGroup as RadixRadioGroup } from "radix-ui";

import { Icon } from "@/components/atoms/Icon";
import { cx, focusRing } from "@/components/atoms/states";

// Figma: Prototype › M11 · Add credits › "Pack · ৳…": price on the left, credits and bonus on the
// right, a "Most chosen" tag. The radio is 22px and fills with a tick when selected.

export interface MobilePack {
  value: string;
  price: string;
  credits: string;
  /** e.g. "+10% bonus". */
  bonus?: string;
  /** e.g. "Most chosen". */
  tag?: string;
}

export interface MobilePackListProps {
  /** Accessible name, e.g. "1. How much?". */
  label: string;
  packs: MobilePack[];
  /** "" when no pack is selected (a custom amount). */
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
}

export function MobilePackList({
  label,
  packs,
  value,
  onValueChange,
  className,
}: MobilePackListProps) {
  return (
    <RadixRadioGroup.Root
      value={value}
      onValueChange={onValueChange}
      aria-label={label}
      className={cx("flex flex-col gap-m-content-gap-sm", className)}
    >
      {packs.map((pack) => (
        <RadixRadioGroup.Item
          key={pack.value}
          value={pack.value}
          className={cx(
            "group flex h-m-pack-h w-full items-center gap-3 rounded-m-row border border-line bg-surface px-m-pack-pad text-left",
            "transition-colors duration-fast ease-out",
            "data-[state=checked]:border-blue data-[state=checked]:bg-blue-soft",
            focusRing,
          )}
        >
          <span
            className={cx(
              "flex size-m-radio shrink-0 items-center justify-center rounded-pill text-on-cta",
              "ring-1 ring-line ring-inset",
              "group-data-[state=checked]:bg-blue group-data-[state=checked]:ring-0",
            )}
          >
            <Icon
              name="tick-02"
              className="size-m-chip-icon opacity-0 group-data-[state=checked]:opacity-100"
            />
          </span>
          <span className="shrink-0 type-m-pack-price text-ink">
            {pack.price}
          </span>
          <span className="min-w-0 flex-1">
            {pack.tag && (
              <span className="inline-block truncate rounded-pill bg-surface px-2 py-0-5 align-middle type-caption text-blue">
                {pack.tag}
              </span>
            )}
          </span>
          <span className="flex shrink-0 flex-col items-end">
            <span className="type-ui text-ink">{pack.credits}</span>
            {pack.bonus && (
              <span className="type-caption text-success">{pack.bonus}</span>
            )}
          </span>
        </RadixRadioGroup.Item>
      ))}
    </RadixRadioGroup.Root>
  );
}
