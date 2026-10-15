import type { HTMLAttributes } from "react";

import { MODELS, type ModelId } from "@/lib/ai/models";

import { cx } from "../states";

// Figma: Design system › Model orb (28:8269). Model × Size mirror the Figma properties.
// Gradients come from Figma as component tokens (they are not Luminous variables yet).

export type ModelOrbSize = "lg" | "md" | "sm";

export interface ModelOrbProps extends HTMLAttributes<HTMLSpanElement> {
  model: ModelId;
  size?: ModelOrbSize;
}

const fills: Record<ModelId, string> = {
  gpt: "bg-(image:--orb-gpt-fill)",
  claude: "bg-(image:--orb-claude-fill)",
  gemini: "bg-(image:--orb-gemini-fill)",
  deepseek: "bg-(image:--orb-deepseek-fill)",
  grok: "bg-(image:--orb-grok-fill)",
};

const sizes: Record<ModelOrbSize, string> = {
  lg: "size-orb-lg type-orb-lg",
  md: "size-orb-md type-orb-md",
  sm: "size-orb-sm",
};

export function ModelOrb({
  model,
  size = "lg",
  className,
  ...props
}: ModelOrbProps) {
  const { name } = MODELS[model];
  return (
    <span
      role="img"
      aria-label={name}
      className={cx(
        "inline-flex shrink-0 items-center justify-center rounded-pill bg-origin-border text-orb-initial select-none",
        // Inset ring, not a border: Chrome rounds 1.5px borders down to 1px.
        "ring-(length:--orb-ring-width) ring-orb-ring ring-inset",
        fills[model],
        sizes[size],
        className,
      )}
      {...props}
    >
      {size !== "sm" && <span aria-hidden>{name.charAt(0)}</span>}
    </span>
  );
}
