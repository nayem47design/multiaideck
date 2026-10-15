"use client";

import { useTranslations } from "next-intl";
import { Dialog } from "radix-ui";

import { Icon } from "@/components/atoms/Icon";
import { cx, focusRing, stateLayer } from "@/components/atoms/states";
import type { ChatSummary } from "@/lib/contracts/chat";
import type { ProjectItem } from "@/lib/projects";

// "Move to project…" from a chat row's menu: the keyboard and touch alternative to dragging a chat
// onto a sidebar project. Not drawn in Figma: built from the New project dialog's tokens (480px
// box, 28px padding, 44px pill buttons) with one row per project; picking a row moves the chat.

export function MoveToProjectDialog({
  chat,
  projects,
  onOpenChange,
  onMove,
}: {
  /** The chat to move; the dialog is open while it is set. */
  chat: ChatSummary | null;
  projects: ProjectItem[];
  onOpenChange: (open: boolean) => void;
  onMove: (projectId: string) => void;
}) {
  const t = useTranslations("projects.moveDialog");
  return (
    <Dialog.Root open={!!chat} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-overlay-scrim" />
        <Dialog.Content
          className={cx(
            "fixed inset-x-0 bottom-0 z-50 flex flex-col gap-3 bg-surface px-5 pt-acct-sheet-pad-top pb-sign-out-pad outline-none",
            "md:inset-x-auto md:top-1/2 md:bottom-auto md:left-1/2 md:w-new-project-width md:-translate-1/2 md:gap-new-project-gap md:rounded-new-project md:border md:border-line md:p-new-project-pad md:shadow-modal",
          )}
        >
          <Dialog.Title className="type-heading text-ink md:type-new-project-title">
            {t("title")}
          </Dialog.Title>
          <Dialog.Description className="type-body text-ink-2">
            {t("body", { title: chat?.title ?? "" })}
          </Dialog.Description>
          {projects.length ? (
            <ul
              aria-label={t("label")}
              className="flex max-h-[50vh] flex-col gap-1 overflow-y-auto"
            >
              {projects.map((p) => {
                const current = p.id === chat?.projectId;
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      disabled={current}
                      aria-current={current || undefined}
                      onClick={() => onMove(p.id)}
                      className={cx(
                        "flex h-new-project-input-h w-full items-center gap-3 rounded-new-project-input px-new-project-input-pad text-left max-md:h-mobile-tap",
                        "type-ui-strong text-ink disabled:cursor-default disabled:text-ink-2",
                        stateLayer,
                        focusRing,
                      )}
                    >
                      <Icon
                        name="folder-01"
                        className="size-icon-md shrink-0 text-blue"
                      />
                      <span className="min-w-0 flex-1 truncate">{p.name}</span>
                      {current && (
                        <span className="type-label text-ink-3">
                          {t("current")}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="type-ui text-ink-2">{t("none")}</p>
          )}
          <div className="flex justify-end">
            <Dialog.Close
              className={cx(
                "inline-flex h-new-project-button-h items-center justify-center rounded-pill bg-surface px-new-project-button-pad type-new-project-button text-ink ring-1 ring-line ring-inset",
                "max-md:h-acct-sheet-button-height max-md:w-full",
                stateLayer,
                focusRing,
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
