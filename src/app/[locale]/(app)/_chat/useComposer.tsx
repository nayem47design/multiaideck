"use client";

import { useTranslations } from "next-intl";
import {
  useEffect,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";

import { AttachSheet } from "@/components/organisms/AttachSheet";
import { ChooseModelsSheet } from "@/components/organisms/ChooseModelsSheet";
import type {
  ComposerAttachment,
  ComposerProps,
} from "@/components/organisms/Composer";
import { ComposerMenu } from "@/components/organisms/ComposerMenu";
import { MobileComposer } from "@/components/organisms/MobileComposer";
import { ModeSheet } from "@/components/organisms/ModeSheet";
import {
  ModelPickerModal,
  type PickerModel,
} from "@/components/organisms/ModelPickerModal";
import { VoiceCapture } from "@/components/organisms/VoiceCapture";
import { api } from "@/lib/api-client";
import {
  DEFAULT_MODELS,
  MAX_MODELS,
  MOBILE_PICKER_ORDER,
  MODEL_SPECS,
  PICKER_ORDER,
} from "@/lib/ai/catalog";
import { MODELS, type ModelId } from "@/lib/ai/models";
import { typicalAnswerMcr } from "@/lib/billing/pricing";
import { credits } from "@/lib/billing/units";
import { builtInKey, usePresets } from "@/lib/chats";
import { EstimateResponse } from "@/lib/contracts/chat";
import { useIsMobile, useIsWide } from "@/lib/hooks/useMedia";
import { DEMO_FILES, DEMO_VOICE } from "@/lib/mock/chat";

import type { ComposerPreset, SheetPreset } from "./state";
import { useChatFormat } from "./useFormat";

// The composer and everything it opens, shared by Home and the chat screens:
//   desktop: Composer (+ menu, voice, files) and the Model picker modal;
//   mobile: Mobile composer, the “+” sheet (M3), voice (M4 → M18), mode sheet (M7), Choose AIs (M25).
// The models start from the preset in use (or the chat's models); the estimate comes from
// POST /api/estimate. Sending is up to the screen (`onSend`). Voice and files are still stand-ins
// (no speech or upload service yet): they fill in the prototype's sample text and files.

export type AnswerMode = "best" | "compare";

export interface SendPayload {
  text: string;
  models: ModelId[];
  attachments: { name: string; kind: "file" | "image"; size: number }[];
}

export interface UseComposerOptions {
  context: "home" | "chat";
  mode: AnswerMode;
  onModeChange: (mode: AnswerMode) => void;
  /** Return false to keep the text (e.g. the send failed). */
  onSend: (payload: SendPayload) => void | boolean | Promise<void | boolean>;
  /** What the stand-in voice input hears. */
  voiceText: string;
  placeholder: { desktop: string; mobile: string };
  /** Follow-ups: the chat, so the estimate includes catch-up. */
  chatId?: string;
  /** Follow-ups: the chat's models (else the preset in use). */
  initialModels?: ModelId[];
  initial?: ComposerPreset;
  initialSheet?: SheetPreset;
  initialValue?: string;
  /** Disable sending (e.g. while answers are on their way). */
  busy?: boolean;
}

/** The mobile Choose AIs sheet allows three (M25). */
const MOBILE_MAX = 3;
const ESTIMATE_DEBOUNCE_MS = 300;

const sizeOf = (s: string) => {
  const m = /([\d.]+)\s*(KB|MB|GB)/i.exec(s);
  if (!m) return 0;
  const unit = { KB: 1e3, MB: 1e6, GB: 1e9 }[m[2].toUpperCase() as "KB"];
  return Math.round(Number(m[1]) * unit);
};

/** POST /api/estimate, debounced. */
function useEstimate(
  text: string,
  mode: AnswerMode,
  models: ModelId[],
  chatId?: string,
) {
  const [estimate, setEstimate] = useState<EstimateResponse | null>(null);
  const key = JSON.stringify([text.trim(), mode, models, chatId]);
  useEffect(() => {
    if (!models.length) return;
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      api("/api/estimate", {
        method: "POST",
        body: { text: text.trim(), mode, models, chatId },
        schema: EstimateResponse,
        signal: ctrl.signal,
      })
        .then(setEstimate)
        .catch(() => {});
    }, ESTIMATE_DEBOUNCE_MS);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
    // `key` covers text, mode, models and chat.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return estimate;
}

export function useComposer({
  context,
  mode,
  onModeChange,
  onSend,
  voiceText,
  placeholder,
  chatId,
  initialModels,
  initial,
  initialSheet,
  initialValue = "",
  busy = false,
}: UseComposerOptions) {
  const t = useTranslations("composer");
  const tp = useTranslations("picker");
  const tc = useTranslations("common");
  const { cr, money, commas } = useChatFormat();
  const mobile = useIsMobile();
  // Between 768 and 1280px the Composer is narrower than Figma's 880px: keep its toolbar on one
  // line by dropping the estimate and using the short models label.
  const wide = useIsWide();
  const presets = usePresets();

  const [value, setValue] = useState(
    initial === "voice-ready" ? voiceText : initialValue,
  );
  const [voiceNote, setVoiceNote] = useState(initial === "voice-ready");
  const [listening, setListening] = useState(initial === "voice");
  const [paused, setPaused] = useState(false);
  // Deep links open the overlay that matches the layout (menu or sheet, modal or sheet): each
  // overlay below is shown only in its layout.
  const [menuOpen, setMenuOpen] = useState(initial === "menu");
  const [attachOpen, setAttachOpen] = useState(initial === "menu");
  const [files, setFiles] = useState<string[]>(
    initial === "files" ? DEMO_FILES.map((f) => f.id) : [],
  );
  // null: follow the chat's models or the preset in use.
  const [picked, setPicked] = useState<ModelId[] | null>(null);
  const models = picked ?? initialModels ?? presets.models;
  const [pickerOpen, setPickerOpen] = useState(initialSheet === "models");
  const [chooseOpen, setChooseOpen] = useState(initialSheet === "models");
  const [modeOpen, setModeOpen] = useState(initialSheet === "mode");
  const [pickerTab, setPickerTab] = useState("chat");
  const [filter, setFilter] = useState("all");
  const [sending, setSending] = useState(false);
  // While the picker is open: the selection being edited, and what applying it does.
  const [draft, setDraft] = useState<ModelId[] | null>(null);
  const onPicked = useRef<((models: ModelId[]) => void) | null>(null);

  const estimate = useEstimate(value, mode, models, chatId);
  const range = estimate
    ? { min: estimate.minCredits, max: estimate.maxCredits }
    : null;

  const attached = DEMO_FILES.filter((f) => files.includes(f.id));
  const send = async () => {
    const text = value.trim();
    if (!text || busy || sending || !models.length) return;
    setSending(true);
    try {
      const ok = await onSend({
        text,
        models,
        attachments: attached.map((f) => ({
          name: f.name,
          kind: f.kind,
          size: sizeOf(f.size),
        })),
      });
      if (ok !== false) {
        setValue("");
        setVoiceNote(false);
        setFiles([]);
      }
    } finally {
      setSending(false);
    }
  };
  const finishVoice = () => {
    setListening(false);
    setValue(voiceText);
    setVoiceNote(true);
  };

  const selection = draft ?? models;
  const toggle = (id: ModelId, on: boolean, max: number) =>
    setDraft((list) => {
      const l = list ?? models;
      return on
        ? l.includes(id) || l.length >= max
          ? l
          : [...l, id]
        : l.filter((m) => m !== id);
    });
  const openPicker = (after?: (models: ModelId[]) => void) => {
    onPicked.current = after ?? null;
    setDraft(models);
    (mobile ? setChooseOpen : setPickerOpen)(true);
  };
  const closePicker = () => {
    setPickerOpen(false);
    setChooseOpen(false);
    setDraft(null);
    onPicked.current = null;
  };
  const applyPicker = () => {
    const next = draft ?? models;
    if (!next.length) return;
    const after = onPicked.current;
    if (after) after(next);
    else setPicked(next);
    closePicker();
  };

  const desktopFiles: ComposerAttachment[] = attached.map((f) => ({
    id: f.id,
    name: f.name,
    kind: f.kind,
    meta:
      "progress" in f && f.progress !== undefined
        ? t("fileUploading", { percent: f.progress })
        : t("fileMeta", { type: f.type, size: f.size }),
    progress: "progress" in f ? f.progress : undefined,
  }));
  // Mobile attaches one file at a time (M19).
  const mobileFiles = attached.slice(0, 1).map((f) => ({
    id: f.id,
    name: f.name,
    kind: f.kind,
    meta: t("fileReady", { type: f.type, size: f.size }),
  }));

  const shortName = (id: ModelId) =>
    id === "claude" || id === "gemini" ? MODELS[id].name : MODEL_SPECS[id].name;

  const modes = [
    { value: "best", label: t("modes.best") },
    { value: "compare", label: t("modes.compare") },
  ];

  const desktopProps: ComposerProps = {
    beam: true,
    state: listening ? "voice-listening" : "default",
    value,
    onValueChange: setValue,
    placeholder: files.length ? t("placeholder.files") : placeholder.desktop,
    "aria-label": t("label"),
    modes,
    mode,
    onModeChange: (m) => onModeChange(m as AnswerMode),
    models,
    estimate:
      wide && range
        ? t("estimate", { min: cr(range.min), max: cr(range.max) })
        : undefined,
    attachments: desktopFiles,
    voice: listening
      ? {
          transcript: voiceText,
          status: t("listening"),
          elapsed: "0:07",
          language: tc("language.english"),
          levels: DEMO_VOICE.levels,
        }
      : undefined,
    labels: {
      attach: t("attach"),
      voice: t("voice"),
      send: t("send"),
      cancelVoice: t("cancelVoice"),
      doneVoice: t("doneVoice"),
      models:
        context === "home" && wide
          ? commas(models.map((m) => MODELS[m].name))
          : t("models", { count: models.length }),
      modeGroup: t("modeGroup"),
      removeAttachment: (name) => t("removeAttachment", { name }),
      language: t("voiceLanguage"),
    },
    attachMenu: (button: ReactElement) => (
      <ComposerMenu
        open={menuOpen && !mobile}
        onOpenChange={setMenuOpen}
        items={[
          {
            icon: "file-02",
            title: t("menu.files.title"),
            description: t("menu.files.description"),
            onSelect: () => setFiles(DEMO_FILES.map((f) => f.id)),
          },
        ]}
      >
        {button}
      </ComposerMenu>
    ),
    onPickModels: () => openPicker(),
    onVoice: () => setListening(true),
    onSend: () => void send(),
    onRemoveAttachment: (id) => setFiles((l) => l.filter((f) => f !== id)),
    onCancelVoice: () => setListening(false),
    onDoneVoice: finishVoice,
    onKeyDown: (e) => {
      if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
        e.preventDefault();
        void send();
      }
    },
  };

  const mobileComposer: ReactNode = (
    <MobileComposer
      beam
      value={value}
      onValueChange={setValue}
      placeholder={files.length ? t("placeholder.file") : placeholder.mobile}
      aria-label={t("label")}
      modeLabel={t(`modes.${mode}`)}
      voiceNote={voiceNote ? t("voiceNote") : undefined}
      files={mobileFiles}
      labels={{
        add: t("attach"),
        mode: t("modeGroup"),
        voice: t("voice"),
        send: t("send"),
        removeFile: (name) => t("removeAttachment", { name }),
      }}
      onAdd={() => setAttachOpen(true)}
      onMode={() => setModeOpen(true)}
      onVoice={() => setListening(true)}
      onSend={() => void send()}
      onRemoveFile={(id) => setFiles((l) => l.filter((f) => f !== id))}
    />
  );

  const typical = (id: ModelId) => credits(typicalAnswerMcr(id));
  const pickerModels: PickerModel[] = PICKER_ORDER.map((id) => {
    const m = MODEL_SPECS[id];
    return {
      id,
      model: id,
      name: m.name,
      provider: m.provider,
      versions: [{ value: m.version, label: m.version }],
      version: m.version,
      tags: m.tags.map((tag) => tp(`tags.${tag}`)),
      speed: m.speed,
      cost: tp("cost", { credits: cr(Math.round(typical(id))) }),
    };
  });
  const perPrompt = selection.reduce((s, id) => s + typical(id), 0);

  // The mode sheet's presets: the built-in ones, by key.
  const builtIn = (key: string) =>
    presets.presets.find((p) => builtInKey(p) === key);
  const presetKey =
    (["recommended", "cheapest", "bangla"] as const).find(
      (k) => JSON.stringify(builtIn(k)?.models) === JSON.stringify(models),
    ) ?? "recommended";

  const overlays: ReactNode = (
    <>
      <ModelPickerModal
        open={pickerOpen && !mobile}
        onOpenChange={(open) => (open ? setPickerOpen(true) : closePicker())}
        labels={{
          title: tp("title"),
          subtitle: tp("subtitle"),
          close: tp("close"),
          selected: tp("selected", { count: selection.length }),
          estimate: tp("estimate", { credits: cr(Math.round(perPrompt)) }),
          remove: (name) => tp("remove", { name }),
          tabs: [
            {
              value: "chat",
              label: tp("tabs.chat"),
              count: cr(PICKER_ORDER.length),
            },
            { value: "image", label: tp("tabs.image"), count: cr(1) },
          ],
          search: tp("search"),
          preset: tp("preset"),
          goodFor: tp("goodFor"),
          columns: {
            model: tp("columns.model"),
            version: tp("columns.version"),
            tags: tp("columns.tags"),
            speed: tp("columns.speed"),
            cost: tp("columns.cost"),
          },
          selectedGroup: tp("selectedGroup", { count: selection.length }),
          moreGroup: tp("moreGroup", {
            count: PICKER_ORDER.length - selection.length,
          }),
          version: (name) => tp("version", { name }),
          reset: tp("reset"),
          hint: tp("hint"),
          savePreset: tp("savePreset"),
          apply: tp("apply", { count: selection.length }),
        }}
        models={pickerModels}
        selected={selection}
        onToggle={(id, on) => toggle(id as ModelId, on, MAX_MODELS)}
        onVersionChange={() => {}}
        tab={pickerTab}
        onTabChange={setPickerTab}
        filters={(
          [
            "all",
            "writing",
            "reasoning",
            "fast",
            "web",
            "open",
            "bangla",
          ] as const
        ).map((f) => ({ value: f, label: tp(`filters.${f}`) }))}
        filter={filter}
        onFilterChange={setFilter}
        onReset={() => setDraft(presets.models ?? DEFAULT_MODELS)}
        onSavePreset={() => {
          if (!selection.length) return;
          void presets.create(
            commas(selection.map((m) => MODEL_SPECS[m].short)),
            selection,
          );
        }}
        onApply={applyPicker}
      />
      <AttachSheet
        open={attachOpen && mobile}
        onOpenChange={setAttachOpen}
        title={t("sheet.title")}
        description={t("sheet.description")}
        cancelLabel={t("voiceScreen.cancel")}
        options={(
          [
            ["camera", "camera-01"],
            ["gallery", "image-01"],
            ["file", "file-02"],
          ] as const
        ).map(([value, icon]) => ({
          value,
          icon,
          title: t(`sheet.${value}.title`),
          description: t(`sheet.${value}.description`),
        }))}
        onSelect={() => {
          setFiles([DEMO_FILES[0].id]);
          setAttachOpen(false);
        }}
      />
      <VoiceCapture
        open={listening && mobile}
        onOpenChange={setListening}
        title={t("voiceScreen.title")}
        transcript={voiceText}
        levels={DEMO_VOICE.levelsMobile}
        language={tc("language.english")}
        paused={paused}
        labels={{
          close: t("cancelVoice"),
          language: t("voiceLanguage"),
          cancel: t("voiceScreen.cancel"),
          done: t("voiceScreen.done"),
          pause: paused ? t("voiceScreen.resume") : t("voiceScreen.pause"),
          hint: t("voiceScreen.hint"),
        }}
        onDone={finishVoice}
        onPause={() => setPaused((p) => !p)}
      />
      <ModeSheet
        open={modeOpen && mobile}
        onOpenChange={setModeOpen}
        title={tp("mode.title")}
        modes={[
          {
            value: "best",
            title: tp("mode.best"),
            tag: tp("mode.recommended"),
            description: tp("mode.bestBody"),
          },
          {
            value: "compare",
            title: tp("mode.compare"),
            description: tp("mode.compareBody"),
          },
        ]}
        mode={mode}
        onModeChange={(m) => onModeChange(m as AnswerMode)}
        presetsLabel={tp("mode.which")}
        presets={(["recommended", "cheapest", "bangla"] as const).map((p) => ({
          value: p,
          label: tp(`mode.presets.${p}`),
        }))}
        preset={presetKey}
        onPresetChange={(key) => {
          const p = builtIn(key);
          if (p) setPicked(p.models);
        }}
        models={models}
        modelNames={commas(models.map(shortName))}
        cost={tp("mode.cost", {
          min: cr(range?.min ?? 0),
          max: cr(range?.max ?? 0),
          minMoney: money(range?.min ?? 0),
          maxMoney: money(range?.max ?? 0),
        })}
        changeLabel={tp("mode.change")}
        onChange={() => {
          setModeOpen(false);
          openPicker();
        }}
        doneLabel={tp("mode.done")}
      />
      <ChooseModelsSheet
        open={chooseOpen && mobile}
        onOpenChange={(open) => (open ? setChooseOpen(true) : closePicker())}
        title={tp("mobile.title", { max: MOBILE_MAX })}
        count={tp("mobile.count", {
          count: selection.length,
          max: MOBILE_MAX,
        })}
        description={tp("mobile.body")}
        options={MOBILE_PICKER_ORDER.map((id) => ({
          id,
          name: shortName(id),
          description: tp("mobile.option", {
            description: tp(`mobile.descriptions.${id as "gpt"}`),
            credits: cr(
              Math.round(credits(typicalAnswerMcr(id, 100)) * 10) / 10,
            ),
          }),
        }))}
        selected={selection}
        onToggle={(id, on) => toggle(id, on, MOBILE_MAX)}
        limitNote={tp("mobile.limit")}
        applyLabel={tp("mobile.apply", { count: selection.length })}
        onApply={applyPicker}
      />
    </>
  );

  return {
    desktopProps,
    mobileComposer,
    overlays,
    value,
    setValue,
    models,
    setModels: (m: ModelId[]) => setPicked(m),
    estimate,
    sending,
    /**
     * Opens the model picker (desktop) or Choose AIs (mobile). With `after`, applying calls it
     * with the chosen models instead of changing the composer's (e.g. "Swap model").
     */
    openPicker,
    /** Opens "How should we answer?" (M7). */
    openModeSheet: () => setModeOpen(true),
    /** Puts the stand-in voice text in the composer, as after dictation (M18). */
    prefillVoice: () => {
      setValue(voiceText);
      setVoiceNote(true);
    },
  };
}
