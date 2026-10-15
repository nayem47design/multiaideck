import { RadioGroup as RadixRadioGroup } from "radix-ui";

import {
  PaymentLogoSlot,
  type PaymentMethod,
} from "@/components/atoms/PaymentLogoSlot";
import { cx, focusRing } from "@/components/atoms/states";

// Figma: Design system › Payment method selector (103:20901). Step 2 of the wallet. Its radio is
// 18px with a 5px ring, smaller than the Radio atom (20 / 6).

export interface PaymentMethodOption {
  value: PaymentMethod;
  name: string;
  /** e.g. "Mobile wallet". */
  description: string;
}

export interface PaymentMethodSelectorProps {
  /** e.g. "2   Pay with". */
  title: string;
  methods: PaymentMethodOption[];
  value: PaymentMethod;
  onValueChange: (value: PaymentMethod) => void;
  className?: string;
}

export function PaymentMethodSelector({
  title,
  methods,
  value,
  onValueChange,
  className,
}: PaymentMethodSelectorProps) {
  return (
    <section
      className={cx(
        "inline-flex flex-col gap-4 rounded-xl border border-line bg-surface p-6 shadow-stat-card",
        className,
      )}
    >
      <h2 className="type-step-title whitespace-pre text-ink">{title}</h2>
      <RadixRadioGroup.Root
        value={value}
        onValueChange={(v) => onValueChange(v as PaymentMethod)}
        aria-label={title}
        className="flex flex-wrap gap-3"
      >
        {methods.map((m) => (
          <label
            key={m.value}
            className={cx(
              "flex cursor-pointer items-center gap-3 rounded-pack-row border border-line bg-surface p-4",
              "transition-colors duration-fast ease-out",
              "has-data-[state=checked]:border-blue has-data-[state=checked]:bg-blue-soft",
            )}
          >
            <PaymentLogoSlot method={m.value} label={m.name} />
            <span className="flex flex-col">
              <span className="type-payment-method-name text-ink">
                {m.name}
              </span>
              <span className="type-caption text-ink-3">{m.description}</span>
            </span>
            <RadixRadioGroup.Item
              value={m.value}
              aria-label={m.name}
              className={cx(
                "size-payment-method-radio shrink-0 rounded-pill bg-surface",
                "ring-(length:--payment-method-radio-border-width) ring-line ring-inset",
                "data-[state=checked]:ring-(length:--payment-method-radio-ring-width) data-[state=checked]:ring-blue",
                focusRing,
              )}
            />
          </label>
        ))}
      </RadixRadioGroup.Root>
    </section>
  );
}
