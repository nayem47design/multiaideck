"use client";

import { Dialog } from "radix-ui";
import { useId, type FormEvent } from "react";

import { Icon, type IconName } from "@/components/atoms/Icon";
import { cx, focusRing, stateLayer } from "@/components/atoms/states";

// Figma: Prototype › "Overlay · New project" (245:36384, Dark 245:36921): a 480px dialog with a
// title, help text, the Project name field, Cancel and Create project. Below 768px it is a bottom
// sheet (as Sign out). Not in Figma, built from tokens: Create disabled while the name is empty,
// busy while saving, the server's error under the field. The same box renames a project (other copy
// and icon). Enter submits (it is a form).

export interface NewProjectDialogContent {
  title: string;
  body: string;
  label: string;
  placeholder: string;
  cancelLabel: string;
  submitLabel: string;
  /** Default folder-add (Create project). */
  submitIcon?: IconName;
}

export interface NewProjectPanelProps extends NewProjectDialogContent {
  value: string;
  onValueChange: (value: string) => void;
  onSubmit: () => void;
  onCancel?: () => void;
  /** Shown under the field, e.g. "You already have a project with this name". */
  error?: string;
  /** Saving: the submit button is busy. */
  busy?: boolean;
  /** Overrides the default (disabled while the name is blank). */
  submitDisabled?: boolean;
  maxLength?: number;
  autoFocus?: boolean;
  /** Renders the title and body as Radix Dialog parts (inside <NewProjectDialog>). */
  inDialog?: boolean;
  className?: string;
}

const button = cx(
  "inline-flex h-new-project-button-h items-center justify-center gap-2 rounded-pill px-new-project-button-pad type-new-project-button",
  "max-md:h-acct-sheet-button-height max-md:w-full max-md:type-acct-row-label",
  "transition-colors duration-fast ease-out disabled:cursor-not-allowed aria-busy:cursor-wait",
  stateLayer,
  focusRing,
);

export function NewProjectPanel({
  title,
  body,
  label,
  placeholder,
  cancelLabel,
  submitLabel,
  submitIcon = "folder-add",
  value,
  onValueChange,
  onSubmit,
  onCancel,
  error,
  busy,
  submitDisabled,
  maxLength,
  autoFocus,
  inDialog,
  className,
}: NewProjectPanelProps) {
  const id = useId();
  const Title = inDialog ? Dialog.Title : "h2";
  const Body = inDialog ? Dialog.Description : "p";
  const disabled = submitDisabled ?? !value.trim();
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!disabled && !busy) onSubmit();
  };
  return (
    <form
      onSubmit={submit}
      noValidate
      className={cx(
        "flex w-full flex-col gap-3 bg-surface px-5 pt-acct-sheet-pad-top pb-sign-out-pad",
        "md:w-new-project-width md:gap-new-project-gap md:rounded-new-project md:border md:border-line md:p-new-project-pad",
        className,
      )}
    >
      <Title className="type-heading text-ink md:type-new-project-title">
        {title}
      </Title>
      <Body className="type-body text-ink-2">{body}</Body>
      <div className="flex flex-col gap-new-project-field-gap">
        <label htmlFor={id} className="type-label text-ink-2">
          {label}
        </label>
        <input
          id={id}
          value={value}
          onChange={(e) => onValueChange(e.currentTarget.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          autoFocus={autoFocus}
          autoComplete="off"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className={cx(
            "h-new-project-input-h w-full min-w-0 rounded-new-project-input bg-surface px-new-project-input-pad type-ui text-ink outline-none placeholder:text-ink-3",
            "max-md:h-input-height max-md:type-input",
            "ring-(length:--input-border-width) ring-line transition-shadow duration-fast ease-out ring-inset",
            "focus:ring-(length:--new-project-input-stroke-width) focus:ring-blue",
            "aria-invalid:ring-(length:--new-project-input-stroke-width) aria-invalid:ring-error",
          )}
        />
        {error && (
          <p id={`${id}-error`} role="alert" className="type-ui text-error">
            {error}
          </p>
        )}
      </div>
      <div className="flex flex-col-reverse gap-3 md:flex-row md:justify-end md:gap-new-project-actions-gap">
        <button
          type="button"
          onClick={onCancel}
          className={cx(
            button,
            "bg-surface text-ink ring-1 ring-line ring-inset",
          )}
        >
          {cancelLabel}
        </button>
        <button
          type="submit"
          disabled={disabled}
          aria-busy={busy || undefined}
          className={cx(
            button,
            "bg-cta text-on-cta",
            "[&:disabled:not([aria-busy=true])]:bg-canvas-deep [&:disabled:not([aria-busy=true])]:text-ink-3",
          )}
        >
          <Icon
            name={busy ? "clock-01" : submitIcon}
            className="size-new-project-button-icon"
          />
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

export interface NewProjectDialogProps extends Omit<
  NewProjectPanelProps,
  "inDialog" | "className" | "onCancel"
> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** The panel opened over the page: a dialog from 768px, a bottom sheet below. */
export function NewProjectDialog({
  open,
  onOpenChange,
  ...panel
}: NewProjectDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-overlay-scrim" />
        <Dialog.Content
          className={cx(
            "fixed inset-x-0 bottom-0 z-50 outline-none",
            "md:inset-x-auto md:top-1/2 md:bottom-auto md:left-1/2 md:-translate-1/2",
          )}
        >
          <span
            aria-hidden
            className="flex h-3 items-center justify-center bg-surface md:hidden"
          >
            <span className="h-acct-sheet-grabber-height w-acct-sheet-grabber-width rounded-pill bg-line" />
          </span>
          <NewProjectPanel
            {...panel}
            inDialog
            autoFocus
            onCancel={() => onOpenChange(false)}
            className="max-md:pt-2 md:shadow-modal"
          />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
