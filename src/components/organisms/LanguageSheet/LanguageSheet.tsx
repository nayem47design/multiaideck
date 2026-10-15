"use client";

import { Dialog, RadioGroup } from "radix-ui";

import { Icon } from "@/components/atoms/Icon";
import { cx, focusRing } from "@/components/atoms/states";

// Figma: Prototype › M39 · Language › "Language sheet": a bottom sheet over the Account screen
// with one option per app language (each written in its own language), a note and Done. Tapping
// the scrim closes it without changing anything.

export interface LanguageSheetOption {
  value: string;
  title: string;
  help: string;
  /** BCP 47 tag the option is written in, e.g. "bn". */
  lang: string;
}

export interface LanguageSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  options: LanguageSheetOption[];
  value: string;
  onValueChange: (value: string) => void;
  note: string;
  doneLabel: string;
  onDone: () => void;
}

export function LanguageSheet({
  open,
  onOpenChange,
  title,
  options,
  value,
  onValueChange,
  note,
  doneLabel,
  onDone,
}: LanguageSheetProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-overlay-scrim" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed inset-x-0 bottom-0 z-50 flex flex-col gap-acct-sheet-gap bg-surface px-5 pt-acct-sheet-pad-top pb-sign-out-pad outline-none md:inset-x-auto md:left-1/2 md:w-sign-out-width md:-translate-x-1/2 md:rounded-t-xl"
        >
          <span aria-hidden className="flex h-3 items-center justify-center">
            <span className="h-acct-sheet-grabber-height w-acct-sheet-grabber-width rounded-pill bg-line" />
          </span>
          <Dialog.Title className="type-heading text-ink">{title}</Dialog.Title>
          <RadioGroup.Root
            value={value}
            onValueChange={onValueChange}
            aria-label={title}
            className="flex flex-col gap-acct-sheet-gap"
          >
            {options.map((option) => (
              <RadioGroup.Item
                key={option.value}
                value={option.value}
                lang={option.lang}
                className={cx(
                  "group flex h-acct-sheet-option-height items-center gap-3 rounded-acct-sheet-option border border-line bg-surface px-4 text-left",
                  "transition-colors duration-fast ease-out hover:bg-canvas",
                  "data-[state=checked]:border-blue data-[state=checked]:bg-blue-soft",
                  focusRing,
                )}
              >
                <span className="flex min-w-0 flex-1 flex-col gap-0-5">
                  <span className="type-acct-sheet-option-title text-ink">
                    {option.title}
                  </span>
                  <span className="type-ui text-ink-2">{option.help}</span>
                </span>
                <span
                  aria-hidden
                  className="flex size-6 shrink-0 items-center justify-center rounded-pill border border-line text-on-cta group-data-[state=checked]:border-blue group-data-[state=checked]:bg-blue"
                >
                  <RadioGroup.Indicator>
                    <Icon name="tick-02" className="size-icon-sm" />
                  </RadioGroup.Indicator>
                </span>
              </RadioGroup.Item>
            ))}
          </RadioGroup.Root>
          <p className="type-ui text-ink-2">{note}</p>
          <button
            type="button"
            onClick={onDone}
            className={cx(
              "flex h-acct-sheet-button-height w-full items-center justify-center rounded-pill bg-cta type-acct-row-label text-on-cta",
              "transition-opacity duration-fast ease-out hover:opacity-90",
              focusRing,
            )}
          >
            {doneLabel}
          </button>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
