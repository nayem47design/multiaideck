import { Icon } from "@/components/atoms/Icon";
import { cx, focusRing, stateLayer } from "@/components/atoms/states";
import { ThinkingDots } from "@/components/atoms/ThinkingDots";

// Not a Figma component yet: the "Status bar" pill on the Compare thinking screens, where the
// Suggestion bar sits once answers are in: dots, "Asking 3 AIs…", progress, and Stop.

export interface ThinkingStatusBarProps {
  /** e.g. "Asking 3 AIs…". */
  title: string;
  /** e.g. "1 of 3 done". */
  message: string;
  stopLabel: string;
  onStop?: () => void;
  className?: string;
}

export function ThinkingStatusBar({
  title,
  message,
  stopLabel,
  onStop,
  className,
}: ThinkingStatusBarProps) {
  return (
    <div
      className={cx(
        "inline-flex h-control-lg max-w-full items-center gap-3 rounded-pill border border-line glass-strong px-4",
        className,
      )}
    >
      <ThinkingDots label="" aria-hidden role={undefined} />
      <span className="shrink-0 type-chat-status-title text-ink">{title}</span>
      <span role="status" className="min-w-0 truncate type-ui text-ink-2">
        {message}
      </span>
      <button
        type="button"
        onClick={onStop}
        className={cx(
          "inline-flex h-control-sm shrink-0 items-center gap-2 rounded-pill border border-line bg-surface px-3 type-chat-status-stop text-ink",
          stateLayer,
          focusRing,
        )}
      >
        <Icon name="stop" className="size-icon-button-icon" />
        {stopLabel}
      </button>
    </div>
  );
}
