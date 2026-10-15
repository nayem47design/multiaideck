import { cx, focusRing, stateLayer } from "@/components/atoms/states";
import { ModelOrbStack } from "@/components/molecules/ModelOrbStack";
import type { ModelId } from "@/lib/ai/models";

// Figma: Prototype › Presets › Grid › "Preset · …": large orbs with an "In use" tag, name,
// description, cost per question (mono) and the Use (tinted) / Edit (ghost) buttons.

export interface PresetCardProps {
  name: string;
  description?: string;
  /** e.g. "≈ 6–14 cr a question". */
  cost: string;
  models: ModelId[];
  /** Tag shown when this preset is the one in use, e.g. "In use". */
  inUseLabel?: string;
  useLabel: string;
  editLabel: string;
  onUse?: () => void;
  onEdit?: () => void;
  className?: string;
}

const action = cx(
  "inline-flex h-control-md items-center rounded-pill type-preset-action",
  stateLayer,
  focusRing,
);

export function PresetCard({
  name,
  description,
  cost,
  models,
  inUseLabel,
  useLabel,
  editLabel,
  onUse,
  onEdit,
  className,
}: PresetCardProps) {
  return (
    <article
      className={cx(
        "flex flex-col gap-preset-card-gap rounded-xl bg-surface p-preset-card-pad ring-1 ring-line ring-inset",
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <ModelOrbStack models={models} size="lg" className="flex-1" />
        {inUseLabel && (
          <span className="rounded-pill bg-blue-soft px-preset-tag-pad py-0-5 type-preset-tag text-blue">
            {inUseLabel}
          </span>
        )}
      </div>
      <h2 className="type-preset-title text-ink">{name}</h2>
      {description && <p className="type-ui text-ink-2">{description}</p>}
      <p className="type-mono text-ink-2">{cost}</p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onUse}
          aria-label={`${useLabel} · ${name}`}
          className={cx(action, "bg-blue-soft px-preset-action-pad text-blue")}
        >
          {useLabel}
        </button>
        <button
          type="button"
          onClick={onEdit}
          aria-label={`${editLabel} · ${name}`}
          className={cx(action, "px-3 text-ink")}
        >
          {editLabel}
        </button>
      </div>
    </article>
  );
}
