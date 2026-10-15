import { cloneElement, type ReactElement } from "react";

import { ModelOrb } from "@/components/atoms/ModelOrb";
import { cx, focusRing } from "@/components/atoms/states";
import type { ModelId } from "@/lib/ai/models";

// Figma: Design system › Chat row (245:28743): State=Default / Active × Models=Three / One.
// The models' orbs (overlapping, in a fixed slot so titles line up), the title and the cost.
// Models follows from `models.length`. Hover is not in Figma: the row takes the active fill.
// `link` is an empty link element (an <a> or Next.js <Link>); the row adds the content.

export interface ChatRowProps {
  title: string;
  /** e.g. "2.6 cr" or "Best · 4 cr", already formatted. */
  cost: string;
  models: ModelId[];
  /** Figma State. */
  state?: "default" | "active";
  link: ReactElement<{ className?: string; "aria-current"?: "page" }>;
  className?: string;
}

export function ChatRow({
  title,
  cost,
  models,
  state = "default",
  link,
  className,
}: ChatRowProps) {
  const active = state === "active";
  return cloneElement(
    link,
    {
      "aria-current": active ? "page" : undefined,
      className: cx(
        "flex h-chat-row-height shrink-0 items-center gap-chat-row-gap rounded-chat-row pr-chat-row-pad-right pl-chat-row-pad-left",
        "transition-colors duration-fast ease-out",
        active ? "bg-canvas-deep" : "hover:bg-canvas-deep",
        focusRing,
        className,
      ),
    },
    <span key="o" className="flex w-chat-row-orbs shrink-0 items-center">
      <span className="flex space-x-chat-row-orb-overlap">
        {models.map((m) => (
          <ModelOrb key={m} model={m} size="sm" />
        ))}
      </span>
    </span>,
    <span
      key="t"
      className={cx(
        "min-w-0 flex-1 truncate text-ink",
        active ? "type-chat-row-title-active" : "type-chat-row-title",
      )}
    >
      {title}
    </span>,
    <span key="c" className="shrink-0 type-chat-row-cost text-ink-3">
      {cost}
    </span>,
  );
}
