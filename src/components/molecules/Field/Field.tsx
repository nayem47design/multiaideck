import { useId } from "react";

import { Input, type InputProps } from "@/components/atoms/Input";
import { cx } from "@/components/atoms/states";

// Figma: Design system › Field (28:8356): label, Input, help text. The error message (help in
// lum/error) is not in Figma; it is built from tokens.

export interface FieldProps extends InputProps {
  label: string;
  help?: string;
  error?: string;
}

export function Field({
  label,
  help,
  error,
  id,
  className,
  ...props
}: FieldProps) {
  const fallbackId = useId();
  const inputId = id ?? fallbackId;
  const helpId = `${inputId}-help`;
  const message = error ?? help;
  return (
    <div className={cx("flex w-full flex-col gap-2", className)}>
      <label htmlFor={inputId} className="type-field-label text-ink-2">
        {label}
      </label>
      <Input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={message ? helpId : undefined}
        {...props}
      />
      {message && (
        <p
          id={helpId}
          className={cx("type-field-help", error ? "text-error" : "text-ink-3")}
        >
          {message}
        </p>
      )}
    </div>
  );
}
