import { Dialog, Tabs } from "radix-ui";
import type { ReactNode } from "react";

import { Button } from "@/components/atoms/Button";
import { Checkbox } from "@/components/atoms/Checkbox";
import { FilterPill } from "@/components/atoms/FilterPill";
import { Icon } from "@/components/atoms/Icon";
import { IconButton } from "@/components/atoms/IconButton";
import { ModelOrb } from "@/components/atoms/ModelOrb";
import { cx, focusRing, stateLayer } from "@/components/atoms/states";
import { ModelChip } from "@/components/molecules/ModelChip";
import { SearchField } from "@/components/molecules/SearchField";
import { Select, type SelectOption } from "@/components/molecules/Select";
import type { ModelId } from "@/lib/ai/models";

// Figma: Design system › Model picker modal (28:9076). Differences from the molecules it reuses
// (listed for the designer): Figma's search is 36px (Search field is 40), its version selects are
// 170×34 (Select is 36), its chip orbs use 9/11 text (Model chip's orb uses 13/16).

export interface PickerModel {
  id: string;
  model: ModelId;
  name: string;
  provider: string;
  versions: SelectOption[];
  version: string;
  tags: string[];
  /** 1–3 filled speed bars. */
  speed: 1 | 2 | 3;
  /** e.g. "~6 cr". */
  cost: string;
}

export interface ModelPickerLabels {
  title: string;
  subtitle: string;
  close: string;
  /** e.g. "3 selected". */
  selected: string;
  /** e.g. "≈ 17 credits per prompt". */
  estimate: string;
  remove: (name: string) => string;
  tabs: { value: string; label: string; count: string }[];
  search: string;
  preset: string;
  goodFor: string;
  columns: {
    model: string;
    version: string;
    tags: string;
    speed: string;
    cost: string;
  };
  /** Group headings, e.g. "SELECTED · 3", "MORE MODELS · 8". */
  selectedGroup: string;
  moreGroup: string;
  version: (name: string) => string;
  reset: string;
  hint: string;
  savePreset: string;
  /** e.g. "Use these 3 models". */
  apply: string;
}

export interface ModelPickerPanelProps {
  labels: ModelPickerLabels;
  models: PickerModel[];
  selected: string[];
  onToggle: (id: string, on: boolean) => void;
  onVersionChange: (id: string, version: string) => void;
  tab: string;
  onTabChange: (tab: string) => void;
  filters: { value: string; label: string }[];
  filter: string;
  onFilterChange: (filter: string) => void;
  onClose?: () => void;
  onReset?: () => void;
  onSavePreset?: () => void;
  onPreset?: () => void;
  onApply?: () => void;
  /** Renders the title as a Radix Dialog title (inside <ModelPickerModal>). */
  inDialog?: boolean;
}

const COLS = {
  check: "w-10",
  model: "w-picker-col-model",
  version: "w-picker-col-version",
  tags: "w-picker-col-tags",
  speed: "w-picker-col-speed",
  cost: "w-picker-col-cost justify-end text-right",
};

function Row({
  m,
  selected,
  labels,
  onToggle,
  onVersionChange,
}: {
  m: PickerModel;
  selected: boolean;
  labels: ModelPickerLabels;
  onToggle: ModelPickerPanelProps["onToggle"];
  onVersionChange: ModelPickerPanelProps["onVersionChange"];
}) {
  return (
    <div
      role="row"
      className={cx(
        "flex h-picker-row-height items-center rounded-md px-3",
        selected && "bg-blue-soft",
      )}
    >
      <span className={cx("flex shrink-0", COLS.check)}>
        <Checkbox
          checked={selected}
          onCheckedChange={(v) => onToggle(m.id, v === true)}
          aria-label={m.name}
        />
      </span>
      <span className={cx("flex shrink-0 items-center gap-3", COLS.model)}>
        <ModelOrb model={m.model} />
        <span className="flex flex-col">
          <span className="type-nav-item-selected text-ink">{m.name}</span>
          <span className="type-caption text-ink-3">{m.provider}</span>
        </span>
      </span>
      <span className={cx("flex shrink-0", COLS.version)}>
        <Select
          label={labels.version(m.name)}
          options={m.versions}
          value={m.version}
          onValueChange={(v) => onVersionChange(m.id, v)}
          className="w-picker-version-width"
        />
      </span>
      <span className={cx("flex shrink-0 gap-1-5", COLS.tags)}>
        {m.tags.map((t) => (
          <span
            key={t}
            className={cx(
              "rounded-pill px-2 py-1 type-model-list-row-tag text-ink-2",
              selected ? "bg-surface" : "bg-canvas",
            )}
          >
            {t}
          </span>
        ))}
      </span>
      <span aria-hidden className={cx("flex shrink-0 gap-1", COLS.speed)}>
        {[1, 2, 3].map((i) => (
          <span
            key={i}
            className={cx(
              "h-picker-speed-bar-height w-picker-speed-bar-width rounded-pill",
              i <= m.speed ? "bg-ink-2" : "bg-line",
            )}
          />
        ))}
      </span>
      <span className={cx("flex shrink-0 type-stepper text-ink", COLS.cost)}>
        {m.cost}
      </span>
    </div>
  );
}

export function ModelPickerPanel({
  labels,
  models,
  selected,
  onToggle,
  onVersionChange,
  tab,
  onTabChange,
  filters,
  filter,
  onFilterChange,
  onClose,
  onReset,
  onSavePreset,
  onPreset,
  onApply,
  inDialog,
}: ModelPickerPanelProps) {
  const Title = inDialog ? Dialog.Title : "h2";
  const Desc = inDialog ? Dialog.Description : "p";
  const chosen = models.filter((m) => selected.includes(m.id));
  const rest = models.filter((m) => !selected.includes(m.id));
  const group = (label: string, list: PickerModel[]): ReactNode => (
    <>
      <h3 className="px-3 pt-3 pb-1 type-group-label text-ink-3">{label}</h3>
      {list.map((m) => (
        <Row
          key={m.id}
          m={m}
          selected={selected.includes(m.id)}
          labels={labels}
          onToggle={onToggle}
          onVersionChange={onVersionChange}
        />
      ))}
    </>
  );

  return (
    <div className="flex h-picker-height w-picker-width flex-col overflow-hidden rounded-2xl bg-surface shadow-dialog">
      <header className="flex gap-3 pt-6 pr-5 pb-4 pl-6">
        <div className="flex flex-1 flex-col gap-1">
          <Title className="type-dialog-title text-ink">{labels.title}</Title>
          <Desc className="type-dialog-hero-body text-ink-2">
            {labels.subtitle}
          </Desc>
        </div>
        <IconButton
          variant="outline"
          icon="cancel-01"
          label={labels.close}
          onClick={onClose}
          sizeClassName="size-10"
        />
      </header>

      <div className="flex items-center gap-2 border-y border-line bg-canvas px-5 py-3">
        <span className="type-label text-ink">{labels.selected}</span>
        {chosen.map((m) => (
          <ModelChip
            key={m.id}
            model={m.model}
            label={m.name}
            removeLabel={labels.remove(m.name)}
            onRemove={() => onToggle(m.id, false)}
          />
        ))}
        <span className="flex-1" />
        <span className="flex items-center gap-1-5 type-cost-estimate text-ink-2">
          <Icon name="coins-01" className="size-dialog-link-icon text-ink-3" />
          {labels.estimate}
        </span>
      </div>

      <div className="flex items-center gap-2 px-5 pt-4 pb-2">
        <Tabs.Root value={tab} onValueChange={onTabChange}>
          <Tabs.List className="inline-flex items-center gap-0-5 rounded-pill bg-canvas-deep p-1">
            {labels.tabs.map((t) => (
              <Tabs.Trigger
                key={t.value}
                value={t.value}
                className={cx(
                  "inline-flex h-segmented-option-height items-center gap-1-5 rounded-pill px-4 type-label text-ink-2",
                  "data-[state=active]:bg-surface data-[state=active]:text-ink data-[state=active]:shadow-segmented-option",
                  focusRing,
                )}
              >
                {t.label}
                <span className="type-shortcut-chip text-ink-3">{t.count}</span>
              </Tabs.Trigger>
            ))}
          </Tabs.List>
        </Tabs.Root>
        <SearchField
          placeholder={labels.search}
          aria-label={labels.search}
          className="flex-1"
        />
        <button
          type="button"
          onClick={onPreset}
          className={cx(
            "inline-flex h-control-md items-center gap-1-5 rounded-pill px-3 type-label text-ink ring-1 ring-line ring-inset",
            stateLayer,
            focusRing,
          )}
        >
          <Icon
            name="bookmark-02"
            className="size-dialog-link-icon text-ink-2"
          />
          {labels.preset}
          <Icon name="arrow-down-01" className="size-select-icon text-ink-3" />
        </button>
      </div>

      <div className="flex items-center gap-1-5 px-5 pt-1 pb-3">
        <span className="type-caption text-ink-3">{labels.goodFor}</span>
        {filters.map((f) => (
          <FilterPill
            key={f.value}
            selected={f.value === filter}
            onClick={() => onFilterChange(f.value)}
          >
            {f.label}
          </FilterPill>
        ))}
      </div>

      <div role="table" className="min-h-0 flex-1 overflow-y-auto px-5">
        <div role="row" className="flex h-control-sm items-center px-3 py-2">
          <span className={cx("shrink-0", COLS.check)} />
          {(["model", "version", "tags", "speed", "cost"] as const).map((k) => (
            <span
              key={k}
              role="columnheader"
              className={cx(
                "flex shrink-0 type-sidebar-section text-ink-3",
                COLS[k],
              )}
            >
              {labels.columns[k]}
            </span>
          ))}
        </div>
        {group(labels.selectedGroup, chosen)}
        {group(labels.moreGroup, rest)}
      </div>

      <footer className="flex items-center gap-2 border-t border-line bg-surface px-5 py-4">
        <button
          type="button"
          onClick={onReset}
          className={cx(
            "rounded-xs type-label text-ink-2 hover:text-ink",
            focusRing,
          )}
        >
          {labels.reset}
        </button>
        <span className="flex items-center gap-1-5 pl-4 type-caption text-ink-3">
          <Icon name="information-circle" className="size-select-icon" />
          {labels.hint}
        </span>
        <span className="flex-1" />
        <button
          type="button"
          onClick={onSavePreset}
          className={cx(
            "inline-flex h-10 items-center rounded-pill px-4 type-label text-ink ring-1 ring-line ring-inset",
            stateLayer,
            focusRing,
          )}
        >
          {labels.savePreset}
        </button>
        <Button onClick={onApply}>{labels.apply}</Button>
      </footer>
    </div>
  );
}

export interface ModelPickerModalProps extends Omit<
  ModelPickerPanelProps,
  "inDialog" | "onClose"
> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ModelPickerModal({
  open,
  onOpenChange,
  ...panel
}: ModelPickerModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-overlay-scrim" />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-50 max-h-full -translate-1/2 outline-none">
          <ModelPickerPanel
            {...panel}
            inDialog
            onClose={() => onOpenChange(false)}
          />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
