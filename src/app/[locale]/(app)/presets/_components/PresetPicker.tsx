"use client";

import { Dialog } from "radix-ui";
import { useFormatter, useTranslations } from "next-intl";
import { useState } from "react";

import { ChooseModelsSheet } from "@/components/organisms/ChooseModelsSheet";
import {
  ModelPickerPanel,
  type PickerModel,
} from "@/components/organisms/ModelPickerModal";
import { useIsMobile } from "@/lib/hooks/useMedia";
import { MAX_MODELS, MODEL_SPECS } from "@/lib/ai/catalog";
import type { ModelId } from "@/lib/ai/models";
import { typicalAnswerMcr } from "@/lib/billing/pricing";
import { credits } from "@/lib/billing/units";
import { PICKER_MODELS as PICKER_TAGS } from "@/lib/mock/presets";

// Names, versions and costs come from the model catalog and pricing; the "good for" tags and
// filters are this picker's own (presets.picker.tags).
const PICKER_MODELS = PICKER_TAGS.map((m) => ({
  ...m,
  name: MODEL_SPECS[m.model].name,
  provider: MODEL_SPECS[m.model].provider,
  version: MODEL_SPECS[m.model].version,
  credits: Math.round(credits(typicalAnswerMcr(m.model))),
}));

// Prototype › Presets: "Edit" and "New preset" open the Model picker overlay (Design system ›
// Model picker modal). Below 768px the 1000px panel can't fit, so the "Choose AIs" sheet (M25)
// opens instead, with the same models and the preset limit.

const FILTER_TAGS = {
  all: null,
  fast: "fast",
  writing: "writing",
  reasoning: "reasoning",
  lowCost: "lowCost",
} as const;
type Filter = keyof typeof FILTER_TAGS;

export interface PresetPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The preset's name, or undefined for a new preset. */
  name?: string;
  /** Model ids (PICKER_MODELS ids) the picker starts with. */
  initial: string[];
  onSave: (models: string[]) => void;
  onSaveAsNew: (models: string[]) => void;
}

export function PresetPicker(props: PresetPickerProps) {
  const mobile = useIsMobile();
  if (mobile) return props.open ? <PresetSheet {...props} /> : null;
  return (
    <Dialog.Root open={props.open} onOpenChange={props.onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-overlay-scrim" />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-50 max-h-full max-w-full -translate-1/2 overflow-auto outline-none">
          {/* Mounted only while open, so it starts from the preset each time. */}
          <PickerBody {...props} />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function PickerBody({
  onOpenChange,
  name,
  initial,
  onSave,
  onSaveAsNew,
}: PresetPickerProps) {
  const t = useTranslations("presets.picker");
  const format = useFormatter();
  const n = (v: number) => format.number(v);
  const [selected, setSelected] = useState(initial);
  const [versions, setVersions] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<Filter>("all");

  const tag = FILTER_TAGS[filter];
  const models: PickerModel[] = PICKER_MODELS.filter(
    (m) => !tag || selected.includes(m.id) || m.tags.includes(tag),
  ).map((m) => ({
    id: m.id,
    model: m.model,
    name: m.name,
    provider: m.provider,
    versions: [{ value: m.version, label: m.version }],
    version: versions[m.id] ?? m.version,
    tags: m.tags.map((x) => t(`tags.${x}`)),
    speed: m.speed,
    cost: t("cost", { credits: n(m.credits) }),
  }));
  const estimate = PICKER_MODELS.filter((m) => selected.includes(m.id)).reduce(
    (sum, m) => sum + m.credits,
    0,
  );
  const rest = models.filter((m) => !selected.includes(m.id)).length;

  return (
    <ModelPickerPanel
      inDialog
      labels={{
        title: name ? t("editTitle", { name }) : t("newTitle"),
        subtitle: t("subtitle"),
        close: t("close"),
        selected: t("selected", { count: n(selected.length) }),
        estimate: t("estimate", { credits: n(estimate) }),
        remove: (model) => t("remove", { name: model }),
        tabs: [
          {
            value: "chat",
            label: t("tabs.chat"),
            count: n(PICKER_MODELS.length),
          },
        ],
        search: t("search"),
        preset: t("preset", { name: name ?? t("newTitle") }),
        goodFor: t("goodFor"),
        columns: {
          model: t("columns.model"),
          version: t("columns.version"),
          tags: t("columns.tags"),
          speed: t("columns.speed"),
          cost: t("columns.cost"),
        },
        selectedGroup: t("selectedGroup", { count: n(selected.length) }),
        moreGroup: t("moreGroup", { count: n(rest) }),
        version: (model) => t("version", { name: model }),
        reset: t("reset"),
        hint: t("hint"),
        savePreset: t("saveAsNew"),
        apply: t("apply"),
      }}
      models={models}
      selected={selected}
      onToggle={(id, on) =>
        setSelected((s) =>
          on
            ? s.length < MAX_MODELS && !s.includes(id)
              ? [...s, id]
              : s
            : s.filter((x) => x !== id),
        )
      }
      onVersionChange={(id, v) => setVersions((all) => ({ ...all, [id]: v }))}
      tab="chat"
      onTabChange={() => {}}
      filters={(Object.keys(FILTER_TAGS) as Filter[]).map((f) => ({
        value: f,
        label: t(`filters.${f}`),
      }))}
      filter={filter}
      onFilterChange={(f) => setFilter(f as Filter)}
      onClose={() => onOpenChange(false)}
      onReset={() => setSelected(initial)}
      onSavePreset={() => selected.length && onSaveAsNew(selected)}
      onApply={() => selected.length && onSave(selected)}
    />
  );
}

function PresetSheet({
  open,
  onOpenChange,
  name,
  initial,
  onSave,
}: PresetPickerProps) {
  const t = useTranslations("presets.picker");
  const tm = useTranslations("picker.mobile");
  const format = useFormatter();
  const [selected, setSelected] = useState(initial);
  const byModel = (id: ModelId) => PICKER_MODELS.find((m) => m.model === id);

  return (
    <ChooseModelsSheet
      open={open}
      onOpenChange={onOpenChange}
      title={name ? t("editTitle", { name }) : t("newTitle")}
      count={tm("count", {
        count: format.number(selected.length),
        max: format.number(MAX_MODELS),
      })}
      description={t("subtitle")}
      options={PICKER_MODELS.map((m) => ({
        id: m.model,
        name: m.name,
        description: tm("option", {
          description: format.list(m.tags.map((x) => t(`tags.${x}`))),
          credits: format.number(m.credits),
        }),
      }))}
      selected={selected
        .map((id) => PICKER_MODELS.find((m) => m.id === id)?.model)
        .filter((m): m is ModelId => !!m)}
      max={MAX_MODELS}
      onToggle={(model, on) => {
        const id = byModel(model)?.id;
        if (!id) return;
        setSelected((s) =>
          on
            ? s.length < MAX_MODELS && !s.includes(id)
              ? [...s, id]
              : s
            : s.filter((x) => x !== id),
        );
      }}
      limitNote={tm("limit")}
      applyLabel={t("apply")}
      onApply={() => selected.length && onSave(selected)}
    />
  );
}
