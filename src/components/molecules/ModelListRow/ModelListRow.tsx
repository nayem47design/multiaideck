import { Checkbox } from "@/components/atoms/Checkbox";
import { ModelOrb } from "@/components/atoms/ModelOrb";
import { cx } from "@/components/atoms/states";
import type { ModelId } from "@/lib/ai/models";

import { Select, type SelectOption } from "../Select";

// Figma: Design system › Model list row (103:20733). State=Selected is `selected`.

export interface ModelListRowProps {
  model: ModelId;
  /** e.g. "GPT-5". */
  name: string;
  /** e.g. "OpenAI". */
  provider: string;
  selected: boolean;
  onSelectedChange: (selected: boolean) => void;
  versions: SelectOption[];
  version: string;
  onVersionChange: (version: string) => void;
  versionLabel: string;
  tags?: string[];
  /** e.g. "~6 cr". */
  cost: string;
  className?: string;
}

export function ModelListRow({
  model,
  name,
  provider,
  selected,
  onSelectedChange,
  versions,
  version,
  onVersionChange,
  versionLabel,
  tags = [],
  cost,
  className,
}: ModelListRowProps) {
  return (
    <div
      className={cx(
        "flex h-model-list-row-height w-full items-center gap-3 rounded-md px-3 transition-colors duration-fast ease-out",
        selected && "bg-blue-soft",
        className,
      )}
    >
      <Checkbox
        checked={selected}
        onCheckedChange={(v) => onSelectedChange(v === true)}
        aria-label={name}
      />
      <ModelOrb model={model} />
      <div className="flex w-model-list-row-info shrink-0 flex-col">
        <p className="type-model-list-row-name text-ink">{name}</p>
        <p className="type-model-list-row-provider text-ink-3">{provider}</p>
      </div>
      <Select
        options={versions}
        value={version}
        onValueChange={onVersionChange}
        label={versionLabel}
        className="w-select-width shrink-0"
      />
      <div className="flex gap-1-5">
        {tags.map((tag) => (
          <span
            key={tag}
            className={cx(
              "rounded-pill px-2 py-1 type-model-list-row-tag text-ink-2",
              selected ? "bg-surface" : "bg-canvas",
            )}
          >
            {tag}
          </span>
        ))}
      </div>
      <span className="ml-auto type-model-list-row-cost text-ink">{cost}</span>
    </div>
  );
}
