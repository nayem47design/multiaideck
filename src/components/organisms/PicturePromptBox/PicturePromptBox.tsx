"use client";

import type { FormEvent } from "react";

import { Button } from "@/components/atoms/Button";
import { Icon } from "@/components/atoms/Icon";
import { cx } from "@/components/atoms/states";
import { ChoicePill } from "@/components/molecules/ChoicePill";

// Figma: Prototype › Image studio › Prompt box (desktop: a card with the prompt over one row of
// style pills, cost and "Create picture") and M21 · Make a picture › Picture sheet (below 768px:
// the prompt in a lum/canvas box, styles, a cost line and a full-width button).

export interface PicturePromptBoxProps {
  prompt: string;
  onPromptChange: (prompt: string) => void;
  styles: { value: string; label: string }[];
  style: string;
  onStyleChange: (style: string) => void;
  onCreate: () => void;
  /** Making the picture: the button shows a spinner and the fields lock. */
  creating?: boolean;
  labels: {
    /** Accessible name of the prompt field. */
    prompt: string;
    placeholder: string;
    /** "Style". */
    style: string;
    /** Desktop cost, e.g. "≈ 40 cr". */
    cost: string;
    /** Mobile cost line, e.g. "Each picture costs about 40 credits (৳0.40)". */
    costLong: string;
    create: string;
  };
  className?: string;
}

export function PicturePromptBox({
  prompt,
  onPromptChange,
  styles,
  style,
  onStyleChange,
  onCreate,
  creating = false,
  labels,
  className,
}: PicturePromptBoxProps) {
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (prompt.trim() && !creating) onCreate();
  };
  return (
    <form
      onSubmit={submit}
      className={cx(
        "flex flex-col gap-images-sheet-gap md:gap-3 md:rounded-xl md:bg-surface md:p-4 md:ring-1 md:ring-line md:ring-inset",
        className,
      )}
    >
      <textarea
        aria-label={labels.prompt}
        placeholder={labels.placeholder}
        value={prompt}
        onChange={(e) => onPromptChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) submit(e);
        }}
        readOnly={creating}
        rows={1}
        className={cx(
          "field-sizing-content w-full resize-none bg-transparent text-ink outline-none placeholder:text-ink-3",
          "md:type-images-prompt",
          "max-md:min-h-images-describe-h max-md:rounded-images-describe max-md:bg-canvas max-md:p-images-describe-pad max-md:type-body",
          "max-md:ring-1 max-md:ring-line max-md:ring-inset max-md:focus:ring-(length:--input-border-focus-width) max-md:focus:ring-blue",
        )}
      />
      <div className="flex flex-col gap-images-sheet-gap md:flex-row md:items-center md:gap-2">
        <span className="type-ui-strong text-ink-2">{labels.style}</span>
        <div
          role="group"
          aria-label={labels.style}
          className="flex flex-wrap gap-2"
        >
          {styles.map((s) => (
            <ChoicePill
              key={s.value}
              selected={s.value === style}
              disabled={creating}
              onClick={() => onStyleChange(s.value)}
              className="max-md:h-choice-pill-h-lg max-md:px-4 max-md:type-choice-pill-lg"
            >
              {s.label}
            </ChoicePill>
          ))}
        </div>
        <span className="flex-1 max-md:hidden" />
        <span className="type-mono whitespace-nowrap text-ink-2 max-md:hidden">
          {labels.cost}
        </span>
        <span className="flex items-center gap-2 type-ui text-ink-2 md:hidden">
          <Icon name="coins-01" className="size-icon-button-icon" />
          {labels.costLong}
        </span>
        <Button
          type="submit"
          icon="ai-magic"
          loading={creating}
          disabled={!prompt.trim()}
          className="max-md:h-images-action-h-mobile max-md:w-full max-md:type-auth-button-mobile"
        >
          {labels.create}
        </Button>
      </div>
    </form>
  );
}
