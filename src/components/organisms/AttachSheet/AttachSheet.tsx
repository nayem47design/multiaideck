"use client";

import { Icon, type IconName } from "@/components/atoms/Icon";
import { cx, focusRing, stateLayer } from "@/components/atoms/states";
import { BottomSheet } from "@/components/molecules/BottomSheet";

// Not a Figma component yet: M3 · “+” sheet: add photos & files. The mobile counterpart of the
// Composer menu: take a photo, choose from gallery, choose a file, or cancel.

export interface AttachOption {
  value: string;
  icon: IconName;
  title: string;
  description: string;
}

export interface AttachSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  options: AttachOption[];
  cancelLabel: string;
  onSelect: (value: string) => void;
}

export function AttachSheet({
  open,
  onOpenChange,
  title,
  description,
  options,
  cancelLabel,
  onSelect,
}: AttachSheetProps) {
  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      gapClassName="gap-2"
    >
      <ul className="flex flex-col">
        {options.map((o) => (
          <li key={o.value}>
            <button
              type="button"
              onClick={() => onSelect(o.value)}
              className={cx(
                "flex h-chat-m-option-height w-full items-center gap-chat-m-option-gap rounded-md px-1 text-left",
                stateLayer,
                focusRing,
              )}
            >
              <span className="flex size-12 shrink-0 items-center justify-center rounded-md bg-blue-soft text-blue">
                <Icon name={o.icon} className="size-mobile-tap-icon" />
              </span>
              <span className="flex min-w-0 flex-col gap-0-5">
                <span className="type-chat-m-name text-ink">{o.title}</span>
                <span className="type-ui text-ink-2">{o.description}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={() => onOpenChange(false)}
        className={cx(
          "inline-flex h-chat-m-button w-full items-center justify-center rounded-pill border border-line bg-surface type-chat-m-name text-ink",
          stateLayer,
          focusRing,
        )}
      >
        {cancelLabel}
      </button>
    </BottomSheet>
  );
}
