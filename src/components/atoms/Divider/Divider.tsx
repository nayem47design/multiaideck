import { Separator } from "radix-ui";
import type { ComponentProps } from "react";

import { cx } from "../states";

// Figma: Design system › Divider (103:20562). Figma's Direction is `orientation`.

export type DividerProps = Omit<
  ComponentProps<typeof Separator.Root>,
  "asChild"
>;

export function Divider({
  orientation = "horizontal",
  className,
  ...props
}: DividerProps) {
  return (
    <Separator.Root
      orientation={orientation}
      className={cx(
        "shrink-0 bg-line",
        orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
        className,
      )}
      {...props}
    />
  );
}
