import { Icon } from "@/components/atoms/Icon";
import { IconButton } from "@/components/atoms/IconButton";
import { cx, focusRing, stateLayer } from "@/components/atoms/states";
import { ChatTitlePill } from "@/components/molecules/ChatTitlePill";

// Not a Figma component yet: the desktop chat chrome on every chat screen (Best answer, Compare,
// Thinking…): the Chat title pill top-left, and Share + more top-right, all on glass.

export interface ChatTopBarProps {
  title: string;
  /** Accessible name for the title pill's menu, e.g. "Chat options". */
  titleMenuLabel?: string;
  shareLabel: string;
  moreLabel: string;
  onTitle?: () => void;
  onShare?: () => void;
  onMore?: () => void;
  className?: string;
}

export function ChatTopBar({
  title,
  titleMenuLabel,
  shareLabel,
  moreLabel,
  onTitle,
  onShare,
  onMore,
  className,
}: ChatTopBarProps) {
  return (
    <div className={cx("flex items-center justify-between gap-2", className)}>
      <ChatTitlePill
        onClick={onTitle}
        aria-label={titleMenuLabel ? `${title}, ${titleMenuLabel}` : undefined}
        className="min-w-0"
      >
        <span className="truncate">{title}</span>
      </ChatTitlePill>
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={onShare}
          className={cx(
            "inline-flex h-control-md items-center gap-1-5 rounded-pill border border-glass-rim glass-strong px-4 type-label text-ink shadow-glass",
            stateLayer,
            focusRing,
          )}
        >
          <Icon name="share-01" className="size-icon-sm" />
          {shareLabel}
        </button>
        <IconButton
          variant="glass"
          icon="more-horizontal"
          label={moreLabel}
          onClick={onMore}
          className="shadow-glass"
        />
      </div>
    </div>
  );
}
