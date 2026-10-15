"use client";

import { Icon } from "@/components/atoms/Icon";
import { ModelOrb } from "@/components/atoms/ModelOrb";
import { cx, focusRing, stateLayer } from "@/components/atoms/states";
import { BottomSheet } from "@/components/molecules/BottomSheet";
import { ChoiceCard, ChoiceGroup } from "@/components/molecules/ChoiceCard";
import type { ModelId } from "@/lib/ai/models";

// Not a Figma component yet: M9 · Follow-up: who should get it? After some AIs missed a prompt,
// send the next one to all (the ones that missed first get your earlier questions, never another
// AI's answer) or only to the AIs that answered.

export interface RecipientChoice {
  value: string;
  models: ModelId[];
  title: string;
  description: string;
  /** e.g. "About 3 credits (৳0.03)". */
  cost: string;
}

export interface RecipientsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  choices: RecipientChoice[];
  value: string;
  onValueChange: (value: string) => void;
  /** e.g. "Each AI answers on its own. They never see each other’s answers." */
  note: string;
  sendLabel: string;
  onSend?: () => void;
}

export function RecipientsSheet({
  open,
  onOpenChange,
  title,
  description,
  choices,
  value,
  onValueChange,
  note,
  sendLabel,
  onSend,
}: RecipientsSheetProps) {
  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={<span className="type-body">{description}</span>}
    >
      <ChoiceGroup value={value} onValueChange={onValueChange} label={title}>
        {choices.map((c) => (
          <ChoiceCard
            key={c.value}
            value={c.value}
            title={c.title}
            description={c.description}
            footnote={c.cost}
            leading={
              <span className="flex space-x-composer-orb-overlap">
                {c.models.map((m) => (
                  <ModelOrb key={m} model={m} size="md" />
                ))}
              </span>
            }
          />
        ))}
      </ChoiceGroup>
      <p className="flex items-center gap-2 type-ui text-ink-2">
        <Icon
          name="information-circle"
          className="size-icon-button-icon shrink-0"
        />
        {note}
      </p>
      <button
        type="button"
        onClick={onSend}
        className={cx(
          "inline-flex h-chat-m-button w-full items-center justify-center rounded-pill bg-cta type-chat-m-name text-on-cta",
          stateLayer,
          focusRing,
        )}
      >
        {sendLabel}
      </button>
    </BottomSheet>
  );
}
