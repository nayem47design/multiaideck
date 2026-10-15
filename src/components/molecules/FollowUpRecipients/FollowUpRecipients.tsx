import { ToggleGroup } from "radix-ui";

import { Icon } from "@/components/atoms/Icon";
import { cx, focusRing } from "@/components/atoms/states";

// Not a Figma component yet: "Follow-up recipients" above the Composer on "Compare · Writing
// prompt 3: who gets it?". After a prompt some AIs missed, the next one can go to all (the ones
// that missed first get your earlier prompts only, never another AI's answer) or only to those
// that answered.

export interface RecipientOption {
  value: string;
  /** e.g. "All 3" or "Only Claude". */
  label: string;
  /** e.g. "get your earlier prompts only". */
  note?: string;
}

export interface FollowUpRecipientsProps {
  /** e.g. "Not every AI answered last time. Send to:". */
  message: string;
  options: RecipientOption[];
  value: string;
  onValueChange: (value: string) => void;
  /** e.g. "Catch-up ≈ 0.5 cr". */
  cost?: string;
  className?: string;
}

export function FollowUpRecipients({
  message,
  options,
  value,
  onValueChange,
  cost,
  className,
}: FollowUpRecipientsProps) {
  return (
    <div
      className={cx(
        "flex flex-wrap items-center gap-3 rounded-lg border border-glass-rim glass-strong py-chat-recipients-pad-y pr-3 pl-4 shadow-glass-strong",
        className,
      )}
    >
      <Icon name="alert-circle" className="size-icon-button-icon text-ink-2" />
      <span id="follow-up-recipients" className="type-ui text-ink">
        {message}
      </span>
      <ToggleGroup.Root
        type="single"
        value={value}
        onValueChange={(v) => v && onValueChange(v)}
        aria-labelledby="follow-up-recipients"
        className="flex flex-wrap items-center gap-3"
      >
        {options.map((o) => (
          <ToggleGroup.Item
            key={o.value}
            value={o.value}
            className={cx(
              "inline-flex h-control-md items-center gap-1-5 rounded-pill border px-3 text-ink",
              "border-line bg-surface data-[state=on]:border-blue data-[state=on]:bg-blue-soft",
              "transition-colors duration-fast ease-out",
              focusRing,
            )}
          >
            <span className="type-ui-strong in-data-[state=on]:text-blue">
              {o.label}
            </span>
            {o.note && (
              <span className="type-caption text-ink-2">{o.note}</span>
            )}
          </ToggleGroup.Item>
        ))}
      </ToggleGroup.Root>
      <span className="flex-1" />
      {cost && <span className="type-caption text-ink-2">{cost}</span>}
    </div>
  );
}
