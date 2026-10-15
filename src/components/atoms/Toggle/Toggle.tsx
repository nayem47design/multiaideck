import { Switch } from "radix-ui";
import type { ComponentProps } from "react";

import { cx, focusRing } from "../states";

// Figma: Design system › Toggle (28:8244). Figma's State=On|Off is `checked`.

export type ToggleProps = Omit<ComponentProps<typeof Switch.Root>, "asChild">;

export function Toggle({ className, ...props }: ToggleProps) {
  return (
    <Switch.Root
      className={cx(
        "group inline-flex h-toggle-height w-toggle-width shrink-0 items-center rounded-pill bg-line",
        "transition-colors duration-fast ease-out data-[state=checked]:bg-blue",
        focusRing,
        "disabled:cursor-not-allowed disabled:opacity-(--toggle-locked)",
        className,
      )}
      {...props}
    >
      <Switch.Thumb
        className={cx(
          "block size-toggle-knob rounded-pill bg-surface",
          "translate-x-(--toggle-inset) transition-transform duration-fast ease-spring",
          "data-[state=checked]:translate-x-[calc(var(--toggle-width)-var(--toggle-knob)-var(--toggle-inset))]",
        )}
      />
    </Switch.Root>
  );
}
