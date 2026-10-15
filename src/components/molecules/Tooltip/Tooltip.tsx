import { Tooltip as RadixTooltip } from "radix-ui";
import type { ReactNode } from "react";

import { cx } from "@/components/atoms/states";

// Figma: Design system › Tooltip (103:20633). Size=Default: title + body on lum/cta, 240px wide.
// Size=Label (227:32986): one line that hugs its text, for icon-only controls such as the
// collapsed sidebar; an optional keyboard shortcut follows the label.

export type TooltipSize = "default" | "label";

export interface TooltipProps {
  title?: string;
  body: string;
  /** Size=Label only, e.g. "⌘N". */
  shortcut?: string;
  size?: TooltipSize;
  /** The element that shows the tooltip on hover or focus. */
  children: ReactNode;
  open?: boolean;
  side?: "top" | "right" | "bottom" | "left";
}

export function Tooltip({
  title,
  body,
  shortcut,
  size = "default",
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
            sideOffset={size === "label" ? 8 : 6}
            className={tooltipClass(size)}
          >
            <TooltipText
              title={title}
              body={body}
              shortcut={shortcut}
              size={size}
            />
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

const tooltipLabel = cx(
  "z-50 flex items-center gap-1 rounded-rail-tooltip bg-cta px-rail-tooltip-pad-x py-rail-tooltip-pad-y whitespace-nowrap text-on-cta",
);

const tooltipClass = (size: TooltipSize) =>
  size === "label" ? tooltipLabel : tooltipContent;

function TooltipText({
  title,
  body,
  shortcut,
  size,
}: Pick<TooltipProps, "title" | "body" | "shortcut"> & { size: TooltipSize }) {
  if (size === "label")
    return (
      <>
        <span className="type-tooltip-body">{body}</span>
        {shortcut && <span className="type-tooltip-body">{shortcut}</span>}
      </>
    );
  return (
    <>
      {title && <p className="type-tooltip-title">{title}</p>}
      <p className="type-tooltip-body">{body}</p>
    </>
  );
}

export function TooltipBox({
  title,
  body,
  shortcut,
  size = "default",
}: Pick<TooltipProps, "title" | "body" | "shortcut" | "size">) {
  return (
    <div className={tooltipClass(size)}>
      <TooltipText title={title} body={body} shortcut={shortcut} size={size} />
    </div>
  );
}
