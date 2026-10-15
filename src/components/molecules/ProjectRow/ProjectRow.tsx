import { cloneElement, type ReactElement } from "react";

import { Icon } from "@/components/atoms/Icon";
import { cx, focusRing } from "@/components/atoms/states";

// Figma: Design system › Project row (245:28699): State=Default / Active. A folder icon, the
// project name and its chat count. Hover is not in Figma: the row takes the active fill
// (lum/canvas-deep) and keeps its default text.
// `link` is an empty link element (an <a> or Next.js <Link>); the row adds the content. While a
// chat is dragged over it (data-over on the link) it takes lum/blue-soft; not in Figma.

export interface ProjectRowProps {
  name: string;
  /** Number of chats, already formatted for the language. */
  count: string;
  /** Figma State. */
  state?: "default" | "active";
  link: ReactElement<{ className?: string; "aria-current"?: "page" }>;
  className?: string;
}

export function ProjectRow({
  name,
  count,
  state = "default",
  link,
  className,
}: ProjectRowProps) {
  const active = state === "active";
  return cloneElement(
    link,
    {
      "aria-current": active ? "page" : undefined,
      className: cx(
        "flex h-project-row-height shrink-0 items-center gap-project-row-gap rounded-project-row px-3",
        "transition-colors duration-fast ease-out",
        active ? "bg-canvas-deep" : "hover:bg-canvas-deep",
        // A chat dragged over the row (data-over, src/lib/projects.tsx useChatDrop).
        "data-over:bg-blue-soft",
        focusRing,
        className,
      ),
    },
    <Icon
      key="i"
      name="folder-01"
      className={cx(
        "size-icon-sm shrink-0",
        active ? "text-blue" : "text-ink-2",
      )}
    />,
    <span
      key="n"
      className={cx(
        "min-w-0 flex-1 truncate",
        active
          ? "type-project-row-name-active text-ink"
          : "type-project-row-name text-ink-2",
      )}
    >
      {name}
    </span>,
    <span key="c" className="shrink-0 type-project-row-count text-ink-3">
      {count}
    </span>,
  );
}
