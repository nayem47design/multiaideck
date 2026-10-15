import { Icon } from "@/components/atoms/Icon";
import { ModelOrb } from "@/components/atoms/ModelOrb";
import { cx, focusRing } from "@/components/atoms/states";
import type { ModelId } from "@/lib/ai/models";

// Figma: Design system › Model chip (28:8335). The orb is a Model orb instance resized to 22px.

export interface ModelChipProps {
  model: ModelId;
  /** Model version shown on the chip, e.g. "GPT-5". */
  label: string;
  /** Accessible name of the remove button, e.g. "Remove GPT-5". Omit to hide the button. */
  removeLabel?: string;
  onRemove?: () => void;
  className?: string;
}

export function ModelChip({
  model,
  label,
  removeLabel,
  onRemove,
  className,
}: ModelChipProps) {
  return (
    <span
      className={cx(
        "inline-flex h-control-sm items-center gap-1-5 rounded-pill border border-line bg-surface pr-1-5 pl-1 type-model-chip text-ink",
        className,
      )}
    >
      <ModelOrb model={model} sizeClassName="size-model-chip-orb" />
      {label}
      {removeLabel && (
        <button
          type="button"
          aria-label={removeLabel}
          onClick={onRemove}
          className={cx("rounded-pill text-ink-3 hover:text-ink", focusRing)}
        >
          <Icon name="cancel-01" className="size-model-chip-remove-icon" />
        </button>
      )}
    </span>
  );
}
