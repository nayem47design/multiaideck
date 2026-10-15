"use client";

import { BorderBeam } from "border-beam";
import type { CSSProperties, ReactNode } from "react";

import { cx } from "@/components/atoms/states";
import { useResolvedTheme } from "@/lib/use-theme";

// A light beam riding around the main prompt input's border (the border-beam package,
// libraries.dev/beam). Not in Figma: a product decision. In the brand blue: the package draws its
// bright head in white (black on light), so BEAM_CSS repaints the stroke and its bloom with the
// Luminous blue, the head a lighter blue for the glow. The soft inner glow uses the "ice" palette,
// hue-shifted from cyan onto the brand blue (that layer only: the package also drifts the stroke's
// hue, by ±hueRange). Follows the app's theme, not only the OS.

// stroke and bloom multiply the package's opacities for size "md" (stroke 0.26 dark, 0.12 light;
// bloom 0.24 dark, 0.34 light), which were tuned for a white head and read too faint in blue.
const LOOK = {
  // Light: the brand blue, with a mid blue head (a pale head would vanish on white).
  light: {
    body: "var(--lum-blue)",
    head: "var(--primitive-blue-400)",
    brightness: 1,
    saturation: 1.3,
    stroke: 7,
    bloom: 2.5,
  },
  // Dark: the dark-mode brand blue, with a pale blue head that glows.
  dark: {
    body: "var(--lum-blue)",
    head: "var(--primitive-blue-300)",
    brightness: 1.15,
    saturation: 1.4,
    stroke: 3.5,
    bloom: 3,
  },
} as const;

/** "ice" sits near hue 198°; the brand blue (blue-600) near 224°. */
const HUE_TO_BRAND = "26deg";

// `{id}` is replaced per instance by the package. Same selectors as its own layers, appended after
// them, so these win. The stroke is 1.5px (the package draws 1px). Stops follow the package's head
// position (≈ 54–82% of the turn).
const BEAM_CSS = `
[data-beam="{id}"][data-active]::before,
[data-beam="{id}"][data-fading]::before { --beam-hue-base: ${HUE_TO_BRAND}; }
[data-beam="{id}"][data-active]::after,
[data-beam="{id}"][data-fading]::after {
  padding: 1.5px;
  background: conic-gradient(
    from var(--beam-angle-{id}),
    transparent 0%, transparent 52%,
    color-mix(in oklch, var(--beam-body) 30%, transparent) 57%,
    var(--beam-body) 62%,
    var(--beam-head) 66%,
    var(--beam-body) 70%,
    color-mix(in oklch, var(--beam-body) 30%, transparent) 75%,
    transparent 80%, transparent 100%
  );
}
[data-beam="{id}"] [data-beam-bloom] {
  background: conic-gradient(
    from var(--beam-angle-{id}),
    transparent 0%, transparent 58%,
    color-mix(in oklch, var(--beam-body) 20%, transparent) 64%,
    var(--beam-body) 68%,
    var(--beam-head) 70.25%,
    var(--beam-body) 72.5%,
    color-mix(in oklch, var(--beam-body) 20%, transparent) 76%,
    transparent 82%
  );
}
`;

export interface InputBeamProps {
  children: ReactNode;
  /** Pause the animation (e.g. while answers are streaming). */
  active?: boolean;
  className?: string;
}

export function InputBeam({
  children,
  active = true,
  className,
}: InputBeamProps) {
  const theme = useResolvedTheme();
  const { body, head, brightness, saturation, stroke, bloom } = LOOK[theme];
  return (
    <BorderBeam
      size="md"
      theme={theme}
      colorVariant="ice"
      strength={1}
      hueRange={6}
      brightness={brightness}
      saturation={saturation}
      active={active}
      css={BEAM_CSS}
      className={cx("w-full", className)}
      style={
        {
          "--beam-body": body,
          "--beam-head": head,
          "--beam-stroke-opacity": stroke,
          "--beam-bloom-opacity": bloom,
        } as CSSProperties
      }
    >
      {children}
    </BorderBeam>
  );
}
