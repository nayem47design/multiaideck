import type { CSSProperties } from "react";

import { AiOrb } from "@/components/atoms/AiOrb";
import { cx } from "@/components/atoms/states";

// Figma: the "Model constellation" drawn on screens (Thinking card, M2 Home, M20, M4): three AI
// orbs, the middle one larger and in front. Sizes are screen tokens (chat-orbs-<size>-*); the
// overlap is derived from them so the group keeps Figma's width.

export type AiOrbGroupSize = "sm" | "md" | "lg" | "xl";

export interface AiOrbGroupProps {
  /** sm: desktop Thinking card · md: mobile thinking (M20) · lg: mobile Home (M2) · xl: voice (M4). */
  size?: AiOrbGroupSize;
  className?: string;
}

const SMALL: Record<AiOrbGroupSize, string> = {
  sm: "size-chat-orbs-sm-small",
  md: "size-chat-orbs-md-small",
  lg: "size-chat-orbs-lg-small",
  xl: "size-chat-orbs-xl-small",
};
const BIG: Record<AiOrbGroupSize, string> = {
  sm: "size-chat-orbs-sm-big",
  md: "size-chat-orbs-md-big",
  lg: "size-chat-orbs-lg-big",
  xl: "size-chat-orbs-xl-big",
};

export function AiOrbGroup({ size = "sm", className }: AiOrbGroupProps) {
  const t = `--chat-orbs-${size}`;
  // Each small orb tucks under the big one by half the extra width.
  const overlap: CSSProperties = {
    marginInline: `calc((var(${t}-w) - 2 * var(${t}-small) - var(${t}-big)) / 2)`,
  };
  return (
    <span
      aria-hidden
      className={cx("inline-flex shrink-0 items-center", className)}
    >
      <AiOrb sizeClassName={SMALL[size]} />
      <AiOrb
        sizeClassName={BIG[size]}
        className="relative z-10"
        style={overlap}
      />
      <AiOrb sizeClassName={SMALL[size]} />
    </span>
  );
}
