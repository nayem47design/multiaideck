import { RadioGroup as RadixRadioGroup } from "radix-ui";
import type { ComponentProps } from "react";

import { cx, focusRing } from "../states";

// Figma: Design system › Radio (28:8256). Figma's State=Selected|Unselected is the group's value.

export type RadioGroupProps = ComponentProps<typeof RadixRadioGroup.Root>;
export type RadioProps = Omit<
  ComponentProps<typeof RadixRadioGroup.Item>,
  "asChild" | "children"
>;

export function RadioGroup({ className, ...props }: RadioGroupProps) {
  return (
    <RadixRadioGroup.Root
      className={cx("flex flex-col gap-3", className)}
      {...props}
    />
  );
}

export function Radio({ className, ...props }: RadioProps) {
  return (
    <RadixRadioGroup.Item
      className={cx(
        "size-radio-size shrink-0 rounded-pill bg-surface",
        // Inset rings, not borders: Chrome rounds 1.5px borders down to 1px.
        "ring-(length:--radio-border-width) ring-line ring-inset",
        "transition-shadow duration-fast ease-out",
        "data-[state=checked]:ring-(length:--radio-ring-width) data-[state=checked]:ring-blue",
        focusRing,
        "disabled:cursor-not-allowed disabled:bg-canvas-deep",
        className,
      )}
      {...props}
    />
  );
}
