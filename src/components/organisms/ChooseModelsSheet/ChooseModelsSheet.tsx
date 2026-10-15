"use client";

import { Icon } from "@/components/atoms/Icon";
import { ModelOrb } from "@/components/atoms/ModelOrb";
import { cx, focusRing, stateLayer } from "@/components/atoms/states";
import { BottomSheet } from "@/components/molecules/BottomSheet";
import type { ModelId } from "@/lib/ai/models";

// Not a Figma component yet: M25 · Choose AIs. Up to three AIs, each with what it is good at and
// a typical cost. When three are ticked, the others are disabled until one is unticked.

export interface ChooseModelsOption {
  id: ModelId;
  name: string;
  /** e.g. "Good all-rounder · ~1 cr". */
  description: string;
}

export interface ChooseModelsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  /** e.g. "3 of 3". */
  count: string;
  description: string;
  options: ChooseModelsOption[];
  selected: ModelId[];
  max?: number;
  onToggle: (id: ModelId, on: boolean) => void;
  /** Shown when the limit is reached, e.g. "To add another, untick one first." */
  limitNote: string;
  /** e.g. "Use these 3". */
  applyLabel: string;
  onApply?: () => void;
}

export function ChooseModelsSheet({
  open,
  onOpenChange,
  title,
  count,
  description,
  options,
  selected,
  max = 3,
  onToggle,
  limitNote,
  applyLabel,
  onApply,
}: ChooseModelsSheetProps) {
  const full = selected.length >= max;
  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      titleAside={
        <span className="type-chat-m-strong text-blue" aria-live="polite">
          {count}
        </span>
      }
      description={description}
      gapClassName="gap-1-5"
    >
      <ul className="flex flex-col gap-1-5">
        {options.map((o) => {
          const on = selected.includes(o.id);
          const disabled = !on && full;
          return (
            <li key={o.id}>
              <button
                type="button"
                role="checkbox"
                aria-checked={on}
                aria-disabled={disabled}
                onClick={() => !disabled && onToggle(o.id, !on)}
                className={cx(
                  "flex h-chat-m-model-row w-full items-center gap-3 rounded-chat-summary px-2 text-left",
                  on && "bg-blue-soft",
                  disabled && "cursor-not-allowed",
                  focusRing,
                )}
              >
                <ModelOrb model={o.id} />
                <span className="flex min-w-0 flex-1 flex-col gap-0-5">
                  <span className="type-chat-m-name text-ink">{o.name}</span>
                  <span className="type-ui text-ink-2">{o.description}</span>
                </span>
                <span
                  aria-hidden
                  className={cx(
                    "flex size-6 shrink-0 items-center justify-center rounded-chat-m-check",
                    on
                      ? "bg-blue text-on-cta"
                      : "border-(length:--chat-m-radio-width) border-line",
                  )}
                >
                  {on && <Icon name="tick-02" className="size-icon-sm" />}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {full && <p className="type-ui text-ink-2">{limitNote}</p>}
      <button
        type="button"
        onClick={onApply}
        className={cx(
          "inline-flex h-chat-m-button w-full items-center justify-center rounded-pill bg-cta type-chat-m-name text-on-cta",
          stateLayer,
          focusRing,
        )}
      >
        {applyLabel}
      </button>
    </BottomSheet>
  );
}
