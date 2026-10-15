"use client";

import { useSyncExternalStore, type HTMLAttributes } from "react";
import { ThinkingOrb, type OrbState } from "thinking-orbs";

import { useResolvedTheme } from "@/lib/use-theme";

import { cx } from "../states";

// Figma: Design system › Thinking dots (103:20563), the "thinking" indicator. The product owner
// replaced Figma's three dots with the Thinking orb (thinking-orbs, libraries.dev/orbs, MIT): a
// 20px animated dotted orb (its inline-text size), tinted with the brand blue (lum/blue) for the
// current theme. Not in Figma yet. Reduced motion: the orb holds still.

export type ThinkingState = OrbState;

export interface ThinkingDotsProps extends HTMLAttributes<HTMLSpanElement> {
  /** Announced to screen readers, e.g. "Thinking". Pass "" when a label sits next to it. */
  label: string;
  /** Which of the orb's animations: "working" (default), "composing" while writing… */
  state?: ThinkingState;
}

/** The brand blue for the theme on screen (the orb needs a colour value, not a variable). */
function brandBlue() {
  return (
    getComputedStyle(document.documentElement)
      .getPropertyValue("--lum-blue")
      .trim() || undefined
  );
}

const REDUCE = "(prefers-reduced-motion: reduce)";
function useReducedMotion() {
  return useSyncExternalStore(
    (onChange) => {
      const mql = matchMedia(REDUCE);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    () => matchMedia(REDUCE).matches,
    () => false,
  );
}

export function ThinkingDots({
  label,
  state = "working",
  className,
  ...props
}: ThinkingDotsProps) {
  const theme = useResolvedTheme();
  // Re-read whenever the theme changes (this re-renders); client only, as is the canvas.
  const blue = useSyncExternalStore(
    () => () => {},
    brandBlue,
    () => undefined,
  );
  const reduce = useReducedMotion();
  return (
    <span
      role="status"
      aria-label={label || undefined}
      className={cx(
        "inline-flex size-5 shrink-0 items-center justify-center",
        className,
      )}
      {...props}
    >
      <ThinkingOrb
        state={state}
        size={20}
        theme={theme}
        color={blue}
        dotSize={1.2}
        paused={reduce}
        aria-hidden
      />
    </span>
  );
}
