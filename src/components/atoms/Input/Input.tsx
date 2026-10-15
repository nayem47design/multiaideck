import type { InputHTMLAttributes, Ref } from "react";

import { cx } from "../states";

// Figma: Design system › Input (28:8284). Figma's State maps to real input states:
// Focus = :focus, Read-only = readOnly, Error = aria-invalid. Inside strokes are inset rings,
// so the thicker focus/error stroke does not move the text.

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  ref?: Ref<HTMLInputElement>;
}

export function Input({ className, ref, ...props }: InputProps) {
  return (
    <input
      ref={ref}
      className={cx(
        "h-input-height w-full min-w-0 rounded-md bg-surface px-4 type-input text-ink placeholder:text-ink-3",
        "ring-(length:--input-border-width) ring-line ring-inset",
        "transition-shadow duration-fast ease-out outline-none",
        "focus:ring-(length:--input-border-focus-width) focus:ring-blue",
        "read-only:bg-canvas read-only:text-ink-2 read-only:focus:ring-(length:--input-border-width) read-only:focus:ring-line",
        "aria-invalid:ring-(length:--input-border-focus-width) aria-invalid:ring-error",
        "disabled:cursor-not-allowed disabled:bg-canvas disabled:text-ink-3",
        className,
      )}
      {...props}
    />
  );
}
