import { Dialog } from "radix-ui";
import { cloneElement, type ReactElement, useState } from "react";

import { Button } from "@/components/atoms/Button";
import { Icon } from "@/components/atoms/Icon";
import { cx } from "@/components/atoms/states";

// Figma: Design system › Delete dialog (28:9112). The confirm input keeps Figma's lum/error
// stroke: it marks a destructive action, not an invalid value.

export interface DeleteDialogContent {
  title: string;
  body: string;
  /** What the person loses, e.g. { label: "Credits", value: "10,684 credits (≈ BDT 106.84)", strong: true }. */
  losses: { label: string; value: string; strong?: boolean }[];
  download: { label: string; link: ReactElement<{ className?: string }> };
  confirmLabel: string;
  /** The word to type, e.g. "DELETE". */
  confirmWord: string;
  cancelLabel: string;
  deleteLabel: string;
}

export interface DeleteDialogPanelProps extends DeleteDialogContent {
  value: string;
  onValueChange: (value: string) => void;
  onCancel?: () => void;
  onDelete?: () => void;
  deleting?: boolean;
  /** Renders the title and body as Radix Dialog parts (inside <DeleteDialog>). */
  inDialog?: boolean;
  /** Extra classes for the panel, e.g. a full-width layout on phones. */
  className?: string;
}

export function DeleteDialogPanel({
  title,
  body,
  losses,
  download,
  confirmLabel,
  confirmWord,
  cancelLabel,
  deleteLabel,
  value,
  onValueChange,
  onCancel,
  onDelete,
  deleting,
  inDialog,
  className,
}: DeleteDialogPanelProps) {
  const Title = inDialog ? Dialog.Title : "h2";
  const Body = inDialog ? Dialog.Description : "p";
  return (
    <div
      className={cx(
        "flex w-dialog-width flex-col gap-4 rounded-2xl bg-surface p-8 shadow-dialog",
        className,
      )}
    >
      <span className="flex size-12 items-center justify-center rounded-dialog-icon bg-status-error-soft text-error">
        <Icon name="delete-02" className="size-dialog-icon-glyph" />
      </span>
      <Title className="type-dialog-title text-ink">{title}</Title>
      <Body className="type-dialog-body text-ink-2">{body}</Body>
      <dl className="flex flex-col rounded-md border border-line">
        {losses.map((loss) => (
          <div key={loss.label} className="flex items-center px-4 py-3">
            <dt className="w-dialog-list-label shrink-0 type-dialog-list text-ink-3">
              {loss.label}
            </dt>
            <dd
              className={
                loss.strong
                  ? "type-dialog-list-strong text-error"
                  : "type-dialog-list text-ink"
              }
            >
              {loss.value}
            </dd>
          </div>
        ))}
      </dl>
      {cloneElement(
        download.link,
        {
          className:
            "inline-flex items-center gap-1-5 self-start text-blue type-label hover:underline",
        },
        <Icon key="i" name="download-01" className="size-dialog-link-icon" />,
        download.label,
      )}
      <label className="flex flex-col gap-2">
        <span className="type-field-label text-ink-2">{confirmLabel}</span>
        <input
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          autoComplete="off"
          spellCheck={false}
          className={cx(
            "h-input-height w-full rounded-md bg-surface px-4 type-dialog-confirm-input text-ink outline-none",
            "ring-(length:--input-border-focus-width) ring-error ring-inset",
          )}
        />
      </label>
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onCancel}>
          {cancelLabel}
        </Button>
        <Button
          variant="destructive"
          onClick={onDelete}
          disabled={value !== confirmWord}
          loading={deleting}
        >
          {deleteLabel}
        </Button>
      </div>
    </div>
  );
}

export interface DeleteDialogProps extends DeleteDialogContent {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: () => void;
  deleting?: boolean;
  /** Extra classes for the positioned dialog content (e.g. side margins on phones). */
  contentClassName?: string;
  /** Extra classes for the panel; see DeleteDialogPanel's className. */
  panelClassName?: string;
}

export function DeleteDialog({
  open,
  onOpenChange,
  onDelete,
  deleting,
  contentClassName,
  panelClassName,
  ...content
}: DeleteDialogProps) {
  const [value, setValue] = useState("");
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-overlay-scrim" />
        <Dialog.Content
          className={cx(
            "fixed top-1/2 left-1/2 z-50 -translate-1/2 outline-none",
            contentClassName,
          )}
        >
          <DeleteDialogPanel
            {...content}
            className={panelClassName}
            inDialog
            value={value}
            onValueChange={setValue}
            onCancel={() => onOpenChange(false)}
            onDelete={onDelete}
            deleting={deleting}
          />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
