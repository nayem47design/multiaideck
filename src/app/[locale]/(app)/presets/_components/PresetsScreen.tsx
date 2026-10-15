"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useState, useSyncExternalStore } from "react";

import { Button } from "@/components/atoms/Button";
import { MobileTopBar } from "@/components/organisms/MobileTopBar";
import { PresetCard } from "@/components/organisms/PresetCard";
import {
  BrowseColumn,
  useBrowseToast,
} from "@/components/templates/BrowseColumn";
import type { ModelId } from "@/lib/ai/models";
import { Link, useRouter } from "@/lib/i18n/navigation";
import {
  DEFAULT_PRESET,
  DEMO_PRESETS,
  PICKER_MODELS,
  presetInUse,
  type DemoPreset,
} from "@/lib/mock/presets";

import { PresetPicker } from "./PresetPicker";

// Figma: Prototype › Presets (desktop; no mobile screen, so below 768px the cards stack under a
// top bar). Prototype: Use → Home; Edit and New preset → Model picker. Edits and new presets live
// on this page (no backend until Phase 6); the preset in use is remembered on this device.

const BUILT_IN = new Set(DEMO_PRESETS.map((p) => p.id));

export function PresetsScreen() {
  const t = useTranslations("presets");
  const format = useFormatter();
  const router = useRouter();
  const { toast, show } = useBrowseToast();
  const inUse = useSyncExternalStore(
    presetInUse.subscribe,
    presetInUse.get,
    () => DEFAULT_PRESET,
  );
  const [presets, setPresets] = useState<DemoPreset[]>(DEMO_PRESETS);
  // undefined: closed; null: new preset; otherwise the preset being edited.
  const [editing, setEditing] = useState<DemoPreset | null | undefined>();
  const n = (v: number) => format.number(v);

  const name = (p: DemoPreset) =>
    p.name ?? (BUILT_IN.has(p.id) ? t(`items.${p.id}.name`) : "");
  const cost = (p: DemoPreset) =>
    typeof p.cost === "number"
      ? t("costOne", { credits: n(p.cost) })
      : t("cost", { low: n(p.cost[0]), high: n(p.cost[1]) });
  const estimate = (models: string[]) =>
    PICKER_MODELS.filter((m) => models.includes(m.id)).reduce(
      (sum, m) => sum + m.credits,
      0,
    );

  const addPreset = (models: string[]) => {
    const preset: DemoPreset = {
      id: `custom-${presets.length + 1}`,
      name: `${t("newName")} ${n(presets.length - DEMO_PRESETS.length + 1)}`,
      models: models as ModelId[],
      cost: estimate(models),
    };
    setPresets((list) => [...list, preset]);
  };
  const save = (models: string[]) => {
    if (editing)
      setPresets((list) =>
        list.map((p) =>
          p.id === editing.id
            ? { ...p, models: models as ModelId[], cost: estimate(models) }
            : p,
        ),
      );
    else addPreset(models);
    setEditing(undefined);
    show(t("saved"));
  };

  return (
    <BrowseColumn
      toast={toast}
      mobileTopBar={
        <MobileTopBar
          title={t("title")}
          back={{ label: t("back"), link: <Link href="/" /> }}
          actions={[
            {
              icon: "add-01",
              label: t("newPreset"),
              onClick: () => setEditing(null),
            },
          ]}
        />
      }
    >
      <div className="flex flex-col gap-browse-gap">
        <header className="flex flex-col gap-browse-gap max-md:gap-2">
          <div className="flex h-control-lg items-center justify-between max-md:hidden">
            <h1 className="type-title text-ink">{t("title")}</h1>
            <Button
              variant="secondary"
              icon="add-01"
              onClick={() => setEditing(null)}
            >
              {t("newPreset")}
            </Button>
          </div>
          <p className="type-body text-ink-2">{t("intro")}</p>
        </header>
        <div className="grid gap-4 md:grid-cols-2">
          {presets.map((p) => (
            <PresetCard
              key={p.id}
              name={name(p)}
              description={
                BUILT_IN.has(p.id) ? t(`items.${p.id}.description`) : undefined
              }
              cost={cost(p)}
              models={p.models}
              inUseLabel={p.id === inUse ? t("inUse") : undefined}
              useLabel={t("use")}
              editLabel={t("edit")}
              onUse={() => {
                presetInUse.set(p.id);
                router.push("/");
              }}
              onEdit={() => setEditing(p)}
            />
          ))}
        </div>
      </div>
      <PresetPicker
        open={editing !== undefined}
        onOpenChange={(open) => !open && setEditing(undefined)}
        name={editing ? name(editing) : undefined}
        initial={editing?.models ?? presets[0].models}
        onSave={save}
        onSaveAsNew={(models) => {
          addPreset(models);
          setEditing(undefined);
          show(t("saved"));
        }}
      />
    </BrowseColumn>
  );
}
