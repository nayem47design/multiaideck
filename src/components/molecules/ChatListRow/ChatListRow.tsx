import {
  cloneElement,
  type ReactElement,
  type ReactNode,
  type Ref,
} from "react";

import { Icon } from "@/components/atoms/Icon";
import { cx, focusRing, stateLayer } from "@/components/atoms/states";
import type { ModelId } from "@/lib/ai/models";

import { ModelOrbStack } from "../ModelOrbStack";

// Figma: Prototype › Chats › List › "Chat · …" (desktop: one 60px line with orbs, title, meta, time
// and a "more" button) and M14 · Chats › "Chat · …" (below 768px: a 68px card, title over meta, no
// more button: press and hold instead). Hover and pressed tint the row (not in Figma).

export interface ChatListRowProps {
  title: string;
  /** Desktop meta, e.g. "Compare · 3 prompts · 6.9 cr". */
  meta: string;
  /** Mobile meta, e.g. "Compare · 3 AIs · 6.9 credits". Defaults to `meta`. */
  mobileMeta?: string;
  /** "11:40", "Tue". */
  time: string;
  models: ModelId[];
  /** The row's link: an empty link element, e.g. <Link href="/c/…" />. */
  link: ReactElement<{ className?: string; children?: ReactNode }>;
  /** The "more" button (desktop only), e.g. a dropdown-menu trigger. */
  more?: ReactNode;
  /** Replaces the title while renaming (e.g. an input); the row stops being a link. */
  editor?: ReactNode;
  /** Pinned chats show a small pin mark before the time (not in Figma). */
  pinnedLabel?: string;
  className?: string;
  ref?: Ref<HTMLDivElement>;
}

export function ChatListRow({
  title,
  meta,
  mobileMeta,
  time,
  models,
  link,
  more,
  editor,
  pinnedLabel,
  className,
  ref,
}: ChatListRowProps) {
  const content = (
    <>
      <span className="flex w-chats-row-orbs-w shrink-0 max-md:w-chats-row-orbs-w-mobile">
        <ModelOrbStack models={models} className="max-md:-space-x-2" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0-5 md:flex-row md:items-center md:gap-chats-row-gap">
        {editor ?? (
          <span className="min-w-0 truncate type-chats-row-title text-ink max-md:type-chats-row-title-mobile md:flex-1">
            {title}
          </span>
        )}
        <span className="truncate type-ui text-ink-2 max-md:hidden">
          {meta}
        </span>
        <span className="truncate type-ui text-ink-2 md:hidden">
          {mobileMeta ?? meta}
        </span>
      </span>
      {pinnedLabel && (
        <Icon
          name="bookmark-02"
          label={pinnedLabel}
          className="size-icon-sm shrink-0 text-blue"
        />
      )}
      <span className="shrink-0 type-ui text-ink-2 md:w-chats-row-time-w md:text-right">
        {time}
      </span>
    </>
  );
  const rowLink = cx(
    "flex min-w-0 flex-1 items-center gap-chats-row-gap self-stretch rounded-md max-md:gap-3",
    focusRing,
  );
  return (
    <div
      ref={ref}
      className={cx(
        "group/row relative flex items-center gap-chats-row-gap rounded-md px-3",
        "h-chats-row-h max-md:h-chats-row-h-mobile max-md:rounded-chats-row-mobile",
        "transition-colors duration-fast ease-out hover:bg-canvas max-md:hover:bg-surface",
        className,
      )}
    >
      {editor ? (
        <div className={rowLink}>{content}</div>
      ) : (
        cloneElement(link, { className: rowLink }, content)
      )}
      {more && <span className="flex shrink-0 max-md:hidden">{more}</span>}
    </div>
  );
}

/** The row's "more" button look, for a menu trigger passed as `more`. */
export const chatRowMoreButton = cx(
  "flex size-control-sm items-center justify-center rounded-pill text-ink-2",
  stateLayer,
  focusRing,
);
