import { useId } from "react";

import { Toggle } from "@/components/atoms/Toggle";
import { cx } from "@/components/atoms/states";

// Figma: Prototype › M40 · Notifications › "Toggle · *": a card with a title, a help line and a
// switch, or a locked label ("Always on") instead of the switch. Figma's switch here is a drawn
// 52×32 shape; this uses the Toggle atom, with the whole card as its tap target.

export interface ToggleCardProps {
  title: string;
  help: string;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  /** e.g. "Always on": replaces the switch. */
  lockedLabel?: string;
  className?: string;
}

export function ToggleCard({
  title,
  help,
  checked,
  onCheckedChange,
  lockedLabel,
  className,
}: ToggleCardProps) {
  const id = useId();
  return (
    <div
      className={cx(
        "flex items-center gap-3 rounded-lg border border-line bg-surface p-acct-card-pad",
        className,
      )}
    >
      <label htmlFor={id} className="flex min-w-0 flex-1 flex-col gap-0-5">
        <span className="type-acct-row-label text-ink">{title}</span>
        <span className="type-ui text-ink-2">{help}</span>
      </label>
      {lockedLabel ? (
        <span id={id} className="shrink-0 type-ui-strong text-ink-2">
          {lockedLabel}
        </span>
      ) : (
        <Toggle id={id} checked={checked} onCheckedChange={onCheckedChange} />
      )}
    </div>
  );
}
