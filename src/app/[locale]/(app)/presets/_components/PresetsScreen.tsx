"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/atoms/Button";
import { Skeleton } from "@/components/atoms/Skeleton";
import { EmptyState } from "@/components/molecules/EmptyState";
import { MobileTopBar } from "@/components/organisms/MobileTopBar";
import { PresetCard } from "@/components/organisms/PresetCard";
import {
  BrowseColumn,
  useBrowseToast,
} from "@/components/templates/BrowseColumn";
import type { ModelId } from "@/lib/ai/models";
import { estimatePrompt } from "@/lib/billing/pricing";
import { credits } from "@/lib/billing/units";
import { builtInKey, usePresets } from "@/lib/chats";
import type { Preset } from "@/lib/contracts/account";
import { Link, useRouter } from "@/lib/i18n/navigation";

import { PresetPicker } from "./PresetPicker";

// Figma: Prototype › Presets (desktop; no mobile screen, so below 768px the cards stack under a
// top bar). Prototype: Use → Home; Edit and New preset → Model picker. Presets are the user's
// (/api/presets); "Use" puts one in use for the composer everywhere. Empty, loading and error:
// 04 · Desktop screens, row 10 (Presets · Empty / Loading / Error).

type DemoPreset = Preset;
/** A short question's tokens, for the "≈ low–high cr a question" line. */
const QUESTION_TOKENS = 30;

export function PresetsScreen() {
  const t = useTranslations("presets");
  const tc = useTranslations("common");
  const format = useFormatter();
  const router = useRouter();
  const { toast, show } = useBrowseToast();
  const store = usePresets();
  const presets = store.presets;
  const inUse = store.inUse?.id;
  // undefined: closed; null: new preset; otherwise the preset being edited.
  const [editing, setEditing] = useState<DemoPreset | null | undefined>();
  const n = (v: number) => format.number(v);

  const key = (p: DemoPreset) =>
    builtInKey(p) as "recommended" | "cheapest" | "bangla" | "writing" | null;
  const name = (p: DemoPreset) => {
    const k = key(p);
    return k ? t(`items.${k}.name`) : p.name;
  };
  const cost = (p: DemoPreset) => {
    const e = estimatePrompt(
      p.models.map((model) => ({
        model,
        inputTokens: QUESTION_TOKENS,
        catchUpTokens: 0,
      })),
      { best: false },
    );
    const low = Math.round(credits(e.minMcr));
    const high = Math.round(credits(e.maxMcr));
    return low === high
      ? t("costOne", { credits: n(low) })
      : t("cost", { low: n(low), high: n(high) });
  };

  const addPreset = async (models: string[]) => {
    const own = presets.filter((p) => !key(p)).length;
    await store.create(`${t("newName")} ${n(own + 1)}`, models as ModelId[]);
  };
  const save = async (models: string[]) => {
    if (editing)
      await store.update(editing.id, { models: models as ModelId[] });
    else await addPreset(models);
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
        {store.status === "loading" && !presets.length ? (
          <div
            role="status"
            aria-label={tc("loading")}
            className="grid gap-4 md:grid-cols-2"
          >
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} variant="card" />
            ))}
          </div>
        ) : !presets.length ? (
          store.status === "error" ? (
            <EmptyState
              tone="error"
              title={t("loadError")}
              body={tc("loadErrorBody")}
              action={
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => void store.refresh()}
                >
                  {tc("tryAgain")}
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon="bookmark-02"
              title={t("empty.title")}
              body={t("empty.body")}
              action={
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setEditing(null)}
                >
                  {t("newPreset")}
                </Button>
              }
            />
          )
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {presets.map((p) => (
              <PresetCard
                key={p.id}
                name={name(p)}
                description={(() => {
                  const k = key(p);
                  return k ? t(`items.${k}.description`) : undefined;
                })()}
                cost={cost(p)}
                models={p.models}
                inUseLabel={p.id === inUse ? t("inUse") : undefined}
                useLabel={t("use")}
                editLabel={t("edit")}
                onUse={() => {
                  void store.update(p.id, { inUse: true });
                  router.push("/");
                }}
                onEdit={() => setEditing(p)}
              />
            ))}
          </div>
        )}
      </div>
      <PresetPicker
        open={editing !== undefined}
        onOpenChange={(open) => !open && setEditing(undefined)}
        name={editing ? name(editing) : undefined}
        initial={editing?.models ?? presets[0]?.models ?? []}
        onSave={(models) => void save(models)}
        onSaveAsNew={(models) => {
          void addPreset(models).then(() => {
            setEditing(undefined);
            show(t("saved"));
          });
        }}
      />
    </BrowseColumn>
  );
}
