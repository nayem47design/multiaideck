"use client";

import { Dialog } from "radix-ui";
import type { ReactNode } from "react";

import { cx } from "@/components/atoms/states";

// Not a Figma component yet: the mobile bottom sheet drawn on M3 (add photos & files), M7 (mode &
// AIs), M9 (who gets the follow-up) and M25 (choose AIs): a scrim, a full-width surface with 28px
// top corners, a grabber, a heading and the sheet's content. Generic: any screen can use it.

export interface BottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  /** Shown under the title (and announced as the dialog's description). */
  description?: ReactNode;
  /** Shown at the end of the title row, e.g. "3 of 3". */
  titleAside?: ReactNode;
  children: ReactNode;
  /** Gap between the sheet's rows; Figma uses 6, 8 or 12px. */
  gapClassName?: string;
  className?: string;
}

export function BottomSheet({
  open,
  onOpenChange,
  title,
  description,
  titleAside,
  children,
  gapClassName = "gap-3",
  className,
}: BottomSheetProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-overlay-scrim" />
        <Dialog.Content
          // Focus the sheet itself, not its first option, so nothing looks pre-selected.
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            (e.currentTarget as HTMLElement | null)?.focus();
          }}
          className={cx(
            "fixed inset-x-0 bottom-0 z-50 flex max-h-dvh flex-col overflow-y-auto rounded-t-2xl bg-surface px-5 pt-3 pb-[max(var(--chat-sheet-pad-bottom),env(safe-area-inset-bottom))] outline-none",
            gapClassName,
            className,
          )}
        >
          <div aria-hidden className="flex h-3 items-center justify-center">
            <span className="h-1 w-10 rounded-pill bg-line" />
          </div>
          <div className="flex items-center justify-between gap-3">
            <Dialog.Title className="type-heading text-ink">
              {title}
            </Dialog.Title>
            {titleAside}
          </div>
          {description ? (
            <Dialog.Description className="type-ui text-ink-2">
              {description}
            </Dialog.Description>
          ) : (
            <Dialog.Description className="sr-only">{title}</Dialog.Description>
          )}
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
