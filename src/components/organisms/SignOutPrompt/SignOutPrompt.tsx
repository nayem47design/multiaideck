"use client";

import { Dialog } from "radix-ui";

import { Icon } from "@/components/atoms/Icon";
import { cx, focusRing } from "@/components/atoms/states";

// Figma: Prototype › "Overlay · Sign out" (a 480px dialog) and, below 768px, M43 · Sign out? (a
// bottom sheet with full-width buttons, Sign out first).

export interface SignOutPromptProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  body: string;
  stayLabel: string;
  signOutLabel: string;
  onSignOut: () => void;
  /** Shows the sign-out button as busy. */
  signingOut?: boolean;
}

const button = cx(
  "flex h-acct-sheet-button-height w-full items-center justify-center gap-2 rounded-pill px-help-contact-button-pad type-acct-row-label",
  "md:h-control-lg md:w-auto md:type-help-contact-button",
  "transition-colors duration-fast ease-out disabled:cursor-wait",
  focusRing,
);

export function SignOutPrompt({
  open,
  onOpenChange,
  title,
  body,
  stayLabel,
  signOutLabel,
  onSignOut,
  signingOut,
}: SignOutPromptProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-overlay-scrim" />
        <Dialog.Content
          className={cx(
            "fixed inset-x-0 bottom-0 z-50 flex flex-col gap-3 bg-surface px-5 pt-acct-sheet-pad-top pb-sign-out-pad outline-none",
            "md:inset-x-auto md:top-1/2 md:bottom-auto md:left-1/2 md:w-sign-out-width md:-translate-1/2 md:gap-sign-out-gap md:rounded-xl md:border md:border-line md:p-sign-out-pad md:shadow-modal",
          )}
        >
          <span
            aria-hidden
            className="flex h-3 items-center justify-center md:hidden"
          >
            <span className="h-acct-sheet-grabber-height w-acct-sheet-grabber-width rounded-pill bg-line" />
          </span>
          <Dialog.Title className="type-heading text-ink md:type-sign-out-title">
            {title}
          </Dialog.Title>
          <Dialog.Description className="type-body text-ink-2">
            {body}
          </Dialog.Description>
          <div className="flex flex-col gap-3 md:flex-row-reverse md:gap-sign-out-actions-gap">
            <button
              type="button"
              onClick={onSignOut}
              disabled={signingOut}
              aria-busy={signingOut || undefined}
              className={cx(
                button,
                "bg-status-error-soft text-error hover:bg-status-error-soft/80",
              )}
            >
              <Icon name="logout-03" className="size-icon-md" />
              {signOutLabel}
            </button>
            <Dialog.Close
              className={cx(
                button,
                "border border-line bg-surface text-ink hover:bg-canvas",
              )}
            >
              {stayLabel}
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
