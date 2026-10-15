"use client";

import {
  useLayoutEffect,
  useRef,
  type ClipboardEvent,
  type KeyboardEvent,
  type Ref,
} from "react";

import { cx } from "@/components/atoms/states";

// Figma: Prototype › Desktop · Enter code › Code boxes, and M17 › Code boxes (taller, below
// 768px): six boxes, the next empty one outlined in lum/blue (Figma's "Digit 4"). Typing moves to
// the next box, Backspace goes back, a pasted or auto-filled code fills every box.

export interface CodeInputProps {
  /** The digits entered so far ("482"). */
  value: string;
  onChange: (value: string) => void;
  /** Called once all boxes are filled. */
  onComplete?: (value: string) => void;
  length?: number;
  /** Accessible name of the group, e.g. "6-digit code". */
  label: string;
  /** Accessible name of one box, e.g. (2) => "Digit 2". */
  digitLabel: (position: number) => string;
  invalid?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  className?: string;
  ref?: Ref<HTMLDivElement>;
}

export function CodeInput({
  value,
  onChange,
  onComplete,
  length = 6,
  label,
  digitLabel,
  invalid,
  disabled,
  autoFocus,
  className,
  ref,
}: CodeInputProps) {
  const boxes = useRef<(HTMLInputElement | null)[]>([]);
  const digits = value.replace(/\D/g, "").slice(0, length);

  const focus = (i: number) => {
    const box = boxes.current[Math.max(0, Math.min(length - 1, i))];
    box?.focus();
    box?.select();
  };

  // Focus moves after the new value renders, so a box's focus check sees the new digits.
  const pendingFocus = useRef<number | null>(null);
  useLayoutEffect(() => {
    if (pendingFocus.current === null) return;
    focus(pendingFocus.current);
    pendingFocus.current = null;
  });

  const commit = (next: string, focusAt: number) => {
    const clean = next.replace(/\D/g, "").slice(0, length);
    pendingFocus.current = focusAt;
    onChange(clean);
    if (clean.length === length) onComplete?.(clean);
  };

  // Typing at box i replaces that digit; several digits at once (SMS auto-fill) fill from i.
  const type = (i: number, typed: string) => {
    const incoming = typed.replace(/\D/g, "");
    if (!incoming) return;
    const start = Math.min(i, digits.length);
    const next = (digits.slice(0, start) + incoming).slice(0, length);
    const rest = incoming.length === 1 ? digits.slice(start + 1) : "";
    commit((next + rest).slice(0, length), start + incoming.length);
  };

  const onKeyDown = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      if (digits[i]) commit(digits.slice(0, i) + digits.slice(i + 1), i);
      else if (i > 0) commit(digits.slice(0, i - 1) + digits.slice(i), i - 1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      focus(i - 1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      focus(Math.min(i + 1, digits.length));
    }
  };

  const onPaste = (i: number, e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "");
    if (pasted.length >= length) commit(pasted, length - 1);
    else type(i, pasted);
  };

  return (
    <div
      ref={ref}
      role="group"
      aria-label={label}
      className={cx("flex w-full gap-2", className)}
    >
      {Array.from({ length }, (_, i) => {
        const current = i === Math.min(digits.length, length - 1);
        return (
          <input
            key={i}
            ref={(el) => {
              boxes.current[i] = el;
            }}
            value={digits[i] ?? ""}
            onChange={(e) =>
              type(i, e.target.value.replace(digits[i] ?? "", ""))
            }
            onKeyDown={(e) => onKeyDown(i, e)}
            onPaste={(e) => onPaste(i, e)}
            onFocus={(e) => {
              // Boxes fill in order: focusing a later empty box goes to the first empty one.
              if (i > digits.length) focus(digits.length);
              else e.currentTarget.select();
            }}
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete={i === 0 ? "one-time-code" : "off"}
            autoFocus={autoFocus && current}
            disabled={disabled}
            aria-label={digitLabel(i + 1)}
            aria-invalid={invalid || undefined}
            className={cx(
              "h-code-box-h w-0 min-w-0 flex-1 rounded-md bg-surface text-center type-code-digit text-ink outline-none",
              "max-md:h-code-box-h-mobile max-md:type-code-digit-mobile",
              "caret-blue transition-shadow duration-fast ease-out ring-inset",
              invalid
                ? "ring-(length:--input-border-focus-width) ring-error"
                : "ring-(length:--input-border-width) ring-line focus:ring-(length:--input-border-focus-width) focus:ring-blue",
              "disabled:cursor-not-allowed disabled:bg-canvas disabled:text-ink-3",
            )}
          />
        );
      })}
    </div>
  );
}
