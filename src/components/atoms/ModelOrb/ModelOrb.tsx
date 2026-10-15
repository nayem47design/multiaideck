import type { HTMLAttributes } from "react";

import { MODELS, type ModelId } from "@/lib/ai/models";

import { AiLogo } from "../AiLogo";
import { MODEL_BRANDS, ModelLogo } from "../ModelLogo";
import { cx } from "../states";

// Figma: Design system › Model orb (28:8269). Model × Size mirror the Figma properties. The orb is
// the model's App icon (AI logo set) clipped to a circle, with a hairline ring (Luminous line).
// Llama has no App icon: its Meta mark sits on the surface colour at 70%, as in Figma.

export type ModelOrbSize = "lg" | "md" | "sm";

export interface ModelOrbProps extends HTMLAttributes<HTMLSpanElement> {
  model: ModelId;
  size?: ModelOrbSize;
  /**
   * Replaces the size's dimensions (a size-* class). For molecules where Figma resizes an orb
   * instance, e.g. Model chip.
   */
  sizeClassName?: string;
  /** Draws the ring outside the orb (Figma "outside" stroke, e.g. Usage card rows). */
  ringOutside?: boolean;
}

const dimensions: Record<ModelOrbSize, string> = {
  lg: "size-orb-lg",
  md: "size-orb-md",
  sm: "size-orb-sm",
};

export function ModelOrb({
  model,
  size = "lg",
  sizeClassName,
  ringOutside = false,
  className,
  ...props
}: ModelOrbProps) {
  const { name } = MODELS[model];
  const brand = MODEL_BRANDS[model];
  return (
    <span
      role="img"
      aria-label={name}
      className={cx(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-pill select-none",
        sizeClassName ?? dimensions[size],
        !brand && "bg-surface",
        // Outside, the ring is the orb's own (not clipped by overflow-hidden).
        ringOutside && "ring-(length:--orb-ring-width) ring-line",
        className,
      )}
      {...props}
    >
      {brand ? (
        <AiLogo
          brand={brand}
          style="app-icon"
          label=""
          sizeClassName="size-full"
        />
      ) : (
        <ModelLogo model={model} label="" sizeClassName="size-[70%]" />
      )}
      {/* Inside, the ring sits above the artwork. A ring, not a border: Chrome rounds thin borders. */}
      {!ringOutside && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-pill ring-(length:--orb-ring-width) ring-line ring-inset"
        />
      )}
    </span>
  );
}
