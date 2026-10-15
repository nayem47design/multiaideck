"use client";

import { useTranslations } from "next-intl";
import { Dialog } from "radix-ui";

import { Icon } from "@/components/atoms/Icon";
import { cx, focusRing, stateLayer } from "@/components/atoms/states";

// "Delete project" from the project menu. Not drawn in Figma: the New project dialog's box (480px,
// 28px padding, pill buttons) with the Sign out dialog's destructive button. The project's chats
// are never deleted: they move back to the chat list.

const button = cx(
  "inline-flex h-new-project-button-h items-center justify-center gap-2 rounded-pill px-new-project-button-pad type-new-project-button",
  "max-md:h-acct-sheet-button-height max-md:w-full max-md:type-acct-row-label",
  "transition-colors duration-fast ease-out disabled:cursor-wait",
  stateLayer,
  focusRing,
);

export function DeleteProjectDialog({
  open,
  onOpenChange,
  name,
  chatCount,
  chatCountLabel,
  busy,
  onDelete,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  name: string;
  chatCount: number;
  /** chatCount formatted for the locale (Bangla digits). */
  chatCountLabel: string;
  busy?: boolean;
  onDelete: () => void;
}) {
  const t = useTranslations("projects.deleteDialog");
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-overlay-scrim" />
        <Dialog.Content
          className={cx(
            "fixed inset-x-0 bottom-0 z-50 flex flex-col gap-3 bg-surface px-5 pt-acct-sheet-pad-top pb-sign-out-pad outline-none",
            "md:inset-x-auto md:top-1/2 md:bottom-auto md:left-1/2 md:w-new-project-width md:-translate-1/2 md:gap-new-project-gap md:rounded-new-project md:border md:border-line md:p-new-project-pad md:shadow-modal",
          )}
        >
          <Dialog.Title className="type-heading text-ink md:type-new-project-title">
            {t("title", { name })}
          </Dialog.Title>
          <Dialog.Description className="type-body text-ink-2">
            {t("body", { count: chatCount, n: chatCountLabel })}
          </Dialog.Description>
          <div className="flex flex-col gap-3 md:flex-row-reverse md:gap-new-project-actions-gap">
            <button
              type="button"
              onClick={onDelete}
              disabled={busy}
              aria-busy={busy || undefined}
              className={cx(button, "bg-status-error-soft text-error")}
            >
              <Icon name="delete-02" className="size-new-project-button-icon" />
              {t("confirm")}
            </button>
            <Dialog.Close
              className={cx(
                button,
                "bg-surface text-ink ring-1 ring-line ring-inset",
              )}
            >
              {t("cancel")}
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
