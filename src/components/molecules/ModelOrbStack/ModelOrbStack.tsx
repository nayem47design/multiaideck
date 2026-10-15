import { ModelOrb, type ModelOrbSize } from "@/components/atoms/ModelOrb";
import { cx } from "@/components/atoms/states";
import type { ModelId } from "@/lib/ai/models";

// Figma: the overlapping "orbs" group on chat rows, search results and preset cards (Model orbs
// with a negative gap: -6px, or -8px on M14). Decorative; the row says which AIs in words.

export interface ModelOrbStackProps {
  models: ModelId[];
  size?: Extract<ModelOrbSize, "md" | "lg">;
  /** "tight" is the M14 overlap (-8px); default -6px. */
  overlap?: "default" | "tight";
  className?: string;
}

export function ModelOrbStack({
  models,
  size = "md",
  overlap = "default",
  className,
}: ModelOrbStackProps) {
  return (
    <span
      aria-hidden
      className={cx(
        "flex shrink-0 items-center",
        overlap === "tight" ? "-space-x-2" : "-space-x-1-5",
        className,
      )}
    >
      {models.map((m) => (
        <ModelOrb key={m} model={m} size={size} />
      ))}
    </span>
  );
}
