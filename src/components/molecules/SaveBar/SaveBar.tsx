import { Button } from "@/components/atoms/Button";
import { cx, focusRing, stateLayer } from "@/components/atoms/states";

// Figma: Design system › Save bar (103:29082). Save is a Button (Primary, md); Discard is a 40px
// pill that is not a Button variant in Figma.

export interface SaveBarProps {
  message: string;
  saveLabel: string;
  discardLabel: string;
  onSave: () => void;
  onDiscard: () => void;
  saving?: boolean;
  className?: string;
}

export function SaveBar({
  message,
  saveLabel,
  discardLabel,
  onSave,
  onDiscard,
  saving,
  className,
}: SaveBarProps) {
  return (
    <div
      role="region"
      aria-label={message}
      className={cx(
        "flex h-save-bar-height w-full items-center gap-3 rounded-pill border border-glass-rim glass-strong py-2 pr-2 pl-5 shadow-save-bar",
        className,
      )}
    >
      <span aria-hidden className="size-2 shrink-0 rounded-pill bg-blue" />
      <p className="flex-1 truncate type-save-bar-message text-ink">
        {message}
      </p>
      <button
        type="button"
        onClick={onDiscard}
        className={cx(
          "inline-flex h-save-bar-discard-height items-center rounded-pill px-4 type-label text-ink",
          stateLayer,
          focusRing,
        )}
      >
        {discardLabel}
      </button>
      <Button onClick={onSave} loading={saving}>
        {saveLabel}
      </Button>
    </div>
  );
}
