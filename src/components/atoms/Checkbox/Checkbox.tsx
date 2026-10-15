import { Checkbox as RadixCheckbox } from "radix-ui";
import type { ComponentProps } from "react";

import { Icon } from "../Icon/Icon";
import { cx, focusRing } from "../states";

// Figma: Design system › Checkbox (28:8251). Figma's State=Checked|Unchecked is `checked`.

export type CheckboxProps = Omit<
  ComponentProps<typeof RadixCheckbox.Root>,
  "asChild"
>;

export function Checkbox({ className, ...props }: CheckboxProps) {
  return (
    <RadixCheckbox.Root
      className={cx(
        "inline-flex size-checkbox-size shrink-0 items-center justify-center rounded-checkbox bg-surface text-on-cta",
        // Inset ring, not a border: Chrome rounds 1.5px borders down to 1px.
        "ring-(length:--checkbox-border-width) ring-line ring-inset",
        "transition-colors duration-fast ease-out",
        "data-[state=checked]:bg-blue data-[state=checked]:ring-0",
        focusRing,
        "disabled:cursor-not-allowed disabled:bg-canvas-deep",
        className,
      )}
      {...props}
    >
      <RadixCheckbox.Indicator>
        <Icon name="tick-02" className="size-checkbox-icon" />
      </RadixCheckbox.Indicator>
    </RadixCheckbox.Root>
  );
}
