import { RadioGroup as RadixRadioGroup } from "radix-ui";

import {
  PaymentLogoSlot,
  type PaymentMethod,
} from "@/components/atoms/PaymentLogoSlot";
import { cx, focusRing } from "@/components/atoms/states";

// Figma: Prototype › M11 · Add credits › "Methods": three equal tiles, logo above the name.
// Figma draws the logos as brand-coloured letters; this uses the Payment logo slot atom until the
// real logos are in the design system.

export interface MethodTilesProps {
  /** Accessible name, e.g. "2. Pay with". */
  label: string;
  methods: { value: PaymentMethod; name: string }[];
  value: PaymentMethod;
  onValueChange: (value: PaymentMethod) => void;
  className?: string;
}

export function MethodTiles({
  label,
  methods,
  value,
  onValueChange,
  className,
}: MethodTilesProps) {
  return (
    <RadixRadioGroup.Root
      value={value}
      onValueChange={(v) => onValueChange(v as PaymentMethod)}
      aria-label={label}
      orientation="horizontal"
      className={cx("flex gap-2", className)}
    >
      {methods.map((m) => (
        <RadixRadioGroup.Item
          key={m.value}
          value={m.value}
          className={cx(
            "flex h-m-method-h min-w-0 flex-1 flex-col items-center justify-center gap-1-5 rounded-m-row border border-line bg-surface p-m-content-gap-sm",
            "transition-colors duration-fast ease-out",
            "data-[state=checked]:border-blue data-[state=checked]:bg-blue-soft",
            focusRing,
          )}
        >
          <PaymentLogoSlot method={m.value} label="" aria-hidden />
          <span className="truncate type-go-pro-button text-ink">{m.name}</span>
        </RadixRadioGroup.Item>
      ))}
    </RadixRadioGroup.Root>
  );
}
