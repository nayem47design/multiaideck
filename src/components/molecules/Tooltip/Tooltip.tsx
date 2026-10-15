import { Tooltip as RadixTooltip } from "radix-ui";
import type { ReactNode } from "react";

import { cx } from "@/components/atoms/states";

// Figma: Design system › Tooltip (103:20633): title + body on lum/cta, 240px wide.

export interface TooltipProps {
  title?: string;
  body: string;
  /** The element that shows the tooltip on hover or focus. */
  children: ReactNode;
  open?: boolean;
  side?: "top" | "right" | "bottom" | "left";
}

export function Tooltip({
  title,
  body,
  children,
  open,
  side = "top",
}: TooltipProps) {
  return (
    <RadixTooltip.Provider delayDuration={300}>
      <RadixTooltip.Root open={open}>
        <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
        <RadixTooltip.Portal>
          <RadixTooltip.Content
            side={side}
            sideOffset={6}
            className={tooltipContent}
          >
            {title && <p className="type-tooltip-title">{title}</p>}
            <p className="type-tooltip-body">{body}</p>
          </RadixTooltip.Content>
        </RadixTooltip.Portal>
      </RadixTooltip.Root>
    </RadixTooltip.Provider>
  );
}

/** The tooltip box, exported for stories and visual tests. */
export const tooltipContent = cx(
  "z-50 flex w-tooltip-width flex-col gap-1 rounded-tooltip bg-cta px-3 py-2 text-on-cta",
);

export function TooltipBox({
  title,
  body,
}: Pick<TooltipProps, "title" | "body">) {
  return (
    <div className={tooltipContent}>
      {title && <p className="type-tooltip-title">{title}</p>}
      <p className="type-tooltip-body">{body}</p>
    </div>
  );
}
