"use client";

import { ModelOrb } from "@/components/atoms/ModelOrb";
import { cx, focusRing, stateLayer } from "@/components/atoms/states";
import { BottomSheet } from "@/components/molecules/BottomSheet";
import { ChoiceCard, ChoiceGroup } from "@/components/molecules/ChoiceCard";
import type { ModelId } from "@/lib/ai/models";

// Not a Figma component yet: M7 · How should we answer? (mode & AIs). Pick Best answer or
// Compare, a preset of AIs, and see which AIs answer and what a question costs.

export interface ModeSheetMode {
  value: string;
  title: string;
  tag?: string;
  description: string;
}

export interface ModeSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  modes: ModeSheetMode[];
  mode: string;
  onModeChange: (mode: string) => void;
  /** e.g. "Which AIs?". */
  presetsLabel: string;
  presets: { value: string; label: string }[];
  preset: string;
  onPresetChange: (preset: string) => void;
  models: ModelId[];
  /** e.g. "GPT-5, Claude, Gemini". */
  modelNames: string;
  /** e.g. "About 6–14 credits (৳0.06–0.14) a question". */
  cost: string;
  changeLabel: string;
  onChange?: () => void;
  doneLabel: string;
}

export function ModeSheet({
  open,
  onOpenChange,
  title,
  modes,
  mode,
  onModeChange,
  presetsLabel,
  presets,
  preset,
  onPresetChange,
  models,
  modelNames,
  cost,
  changeLabel,
  onChange,
  doneLabel,
}: ModeSheetProps) {
  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title={title}>
      <ChoiceGroup value={mode} onValueChange={onModeChange} label={title}>
        {modes.map((m) => (
          <ChoiceCard key={m.value} {...m} />
        ))}
      </ChoiceGroup>
      <div className="flex flex-col gap-2">
        <p id="mode-sheet-presets" className="type-ui-strong text-ink-2">
          {presetsLabel}
        </p>
        <div
          role="radiogroup"
          aria-labelledby="mode-sheet-presets"
          className="flex flex-wrap gap-2"
        >
          {presets.map((p) => {
            const on = p.value === preset;
            return (
              <button
                key={p.value}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => onPresetChange(p.value)}
                className={cx(
                  "inline-flex h-10 items-center rounded-pill border px-chat-m-pill-pad type-ui-strong",
                  on
                    ? "border-blue bg-blue-soft text-blue"
                    : "border-line bg-surface text-ink",
                  stateLayer,
                  focusRing,
                )}
              >
                {p.label}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-chat-m-file-gap rounded-chat-m-choice bg-canvas px-chat-m-choice-pad py-3">
          <span className="flex shrink-0 space-x-composer-orb-overlap">
            {models.map((m) => (
              <ModelOrb key={m} model={m} size="md" />
            ))}
          </span>
          <span className="flex min-w-0 flex-1 flex-col gap-0-5">
            <span className="type-chat-m-strong text-ink">{modelNames}</span>
            <span className="type-ui text-ink-2">{cost}</span>
          </span>
          <button
            type="button"
            onClick={onChange}
            className={cx(
              "shrink-0 rounded-xs type-chat-m-strong text-blue",
              focusRing,
            )}
          >
            {changeLabel}
          </button>
        </div>
      </div>
      <button
        type="button"
        onClick={() => onOpenChange(false)}
        className={cx(
          "inline-flex h-chat-m-button w-full items-center justify-center rounded-pill bg-cta type-chat-m-name text-on-cta",
          stateLayer,
          focusRing,
        )}
      >
        {doneLabel}
      </button>
    </BottomSheet>
  );
}
