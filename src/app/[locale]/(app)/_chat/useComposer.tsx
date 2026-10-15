"use client";

import { useTranslations } from "next-intl";
import { useState, type ReactElement, type ReactNode } from "react";

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
import { MODELS, type ModelId } from "@/lib/ai/models";
import {
  DEMO_FILES,
  DEMO_VOICE,
  MOBILE_PICKER_IDS,
  PICKER_MODELS,
} from "@/lib/mock/chat";

import type { ComposerPreset, SheetPreset } from "./state";
import { useChatFormat } from "./useFormat";
import { useIsMobile, useIsWide } from "@/lib/hooks/useMedia";

// The composer and everything it opens, shared by Home and the chat screens:
//   desktop: Composer (+ menu, voice, files) and the Model picker modal;
//   mobile: Mobile composer, the “+” sheet (M3), voice (M4 → M18), mode sheet (M7), Choose AIs (M25).
// Sending is up to the screen (`onSend`); this demo has no backend.

export type AnswerMode = "best" | "compare";

export interface UseComposerOptions {
  context: "home" | "chat";
  mode: AnswerMode;
  onModeChange: (mode: AnswerMode) => void;
  onSend: (text: string) => void;
  /** What the demo voice input hears. */
  voiceText: string;
  placeholder: { desktop: string; mobile: string };
  /** Composer estimate, e.g. { min: 2, max: 4 } → "≈ 2 to 4 cr". */
  estimate: { min: number; max: number };
  initial?: ComposerPreset;
  initialSheet?: SheetPreset;
  /** Text already in the composer (e.g. the prototype's prompt 3). */
  initialValue?: string;
}

const DEFAULT_MODELS: ModelId[] = ["gpt", "claude", "gemini"];

export function useComposer({
  context,
  mode,
  onModeChange,
  onSend,
  voiceText,
  placeholder,
  estimate,
  initial,
  initialSheet,
  initialValue = "",
}: UseComposerOptions) {
  const t = useTranslations("composer");
  const tp = useTranslations("picker");
  const tc = useTranslations("common");
  const { cr, money, commas } = useChatFormat();
  const mobile = useIsMobile();
  // Between 768 and 1280px the Composer is narrower than Figma's 880px: keep its toolbar on one
  // line by dropping the estimate and using the short models label.
  const wide = useIsWide();

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
  const [models, setModels] = useState<ModelId[]>(DEFAULT_MODELS);
  const [pickerOpen, setPickerOpen] = useState(initialSheet === "models");
  const [chooseOpen, setChooseOpen] = useState(initialSheet === "models");
  const [modeOpen, setModeOpen] = useState(initialSheet === "mode");
  const [preset, setPreset] = useState("recommended");
  const [pickerTab, setPickerTab] = useState("chat");
  const [filter, setFilter] = useState("all");

  const send = () => {
    onSend(value);
    setValue("");
    setVoiceNote(false);
    setFiles([]);
  };
  const finishVoice = () => {
    setListening(false);
    setValue(voiceText);
    setVoiceNote(true);
  };
  const toggleModel = (id: ModelId, on: boolean) =>
    setModels((list) =>
      on
        ? list.includes(id)
          ? list
          : [...list, id]
        : list.filter((m) => m !== id),
    );

  const attached = DEMO_FILES.filter((f) => files.includes(f.id));
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

  const modelName = (id: ModelId) =>
    PICKER_MODELS.find((m) => m.id === id)?.name ?? MODELS[id].name;
  const shortName = (id: ModelId) =>
    id === "claude" || id === "gemini" ? MODELS[id].name : modelName(id);

  const modes = [
    { value: "best", label: t("modes.best") },
    { value: "compare", label: t("modes.compare") },
  ];

  const desktopProps: ComposerProps = {
    state: listening ? "voice-listening" : "default",
    value,
    onValueChange: setValue,
    placeholder: files.length ? t("placeholder.files") : placeholder.desktop,
    "aria-label": t("label"),
    modes,
    mode,
    onModeChange: (m) => onModeChange(m as AnswerMode),
    models,
    estimate: wide
      ? t("estimate", { min: cr(estimate.min), max: cr(estimate.max) })
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
    onPickModels: () => setPickerOpen(true),
    onVoice: () => setListening(true),
    onSend: send,
    onRemoveAttachment: (id) => setFiles((l) => l.filter((f) => f !== id)),
    onCancelVoice: () => setListening(false),
    onDoneVoice: finishVoice,
    onKeyDown: (e) => {
      if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
        e.preventDefault();
        send();
      }
    },
  };

  const mobileComposer: ReactNode = (
    <MobileComposer
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
      onSend={send}
      onRemoveFile={(id) => setFiles((l) => l.filter((f) => f !== id))}
    />
  );

  const pickerModels: PickerModel[] = PICKER_MODELS.map((m) => ({
    id: m.id,
    model: m.id,
    name: m.name,
    provider: m.provider,
    versions: [{ value: m.version, label: m.version }],
    version: m.version,
    tags: m.tags.map((tag) => tp(`tags.${tag}`)),
    speed: m.speed,
    cost: tp("cost", { credits: cr(m.cost) }),
  }));
  const perPrompt = PICKER_MODELS.filter((m) => models.includes(m.id)).reduce(
    (s, m) => s + m.cost,
    0,
  );

  const overlays: ReactNode = (
    <>
      <ModelPickerModal
        open={pickerOpen && !mobile}
        onOpenChange={setPickerOpen}
        labels={{
          title: tp("title"),
          subtitle: tp("subtitle"),
          close: tp("close"),
          selected: tp("selected", { count: models.length }),
          estimate: tp("estimate", { credits: cr(perPrompt) }),
          remove: (name) => tp("remove", { name }),
          tabs: [
            { value: "chat", label: tp("tabs.chat"), count: cr(11) },
            { value: "image", label: tp("tabs.image"), count: cr(2) },
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
          selectedGroup: tp("selectedGroup", { count: models.length }),
          moreGroup: tp("moreGroup", {
            count: PICKER_MODELS.length - models.length,
          }),
          version: (name) => tp("version", { name }),
          reset: tp("reset"),
          hint: tp("hint"),
          savePreset: tp("savePreset"),
          apply: tp("apply", { count: models.length }),
        }}
        models={pickerModels}
        selected={models}
        onToggle={(id, on) => toggleModel(id as ModelId, on)}
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
        onReset={() => setModels(DEFAULT_MODELS)}
        onApply={() => setPickerOpen(false)}
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
        preset={preset}
        onPresetChange={setPreset}
        models={models}
        modelNames={commas(models.map(shortName))}
        cost={tp("mode.cost", {
          min: cr(6),
          max: cr(14),
          minMoney: money(6),
          maxMoney: money(14),
        })}
        changeLabel={tp("mode.change")}
        onChange={() => {
          setModeOpen(false);
          setChooseOpen(true);
        }}
        doneLabel={tp("mode.done")}
      />
      <ChooseModelsSheet
        open={chooseOpen && mobile}
        onOpenChange={setChooseOpen}
        title={tp("mobile.title", { max: 3 })}
        count={tp("mobile.count", { count: models.length, max: 3 })}
        description={tp("mobile.body")}
        options={MOBILE_PICKER_IDS.map((id) => {
          const m = PICKER_MODELS.find((p) => p.id === id);
          return {
            id,
            name: shortName(id),
            description: tp("mobile.option", {
              description: tp(`mobile.descriptions.${id as "gpt"}`),
              credits: cr(m?.costMobile ?? 1),
            }),
          };
        })}
        selected={models}
        onToggle={toggleModel}
        limitNote={tp("mobile.limit")}
        applyLabel={tp("mobile.apply", { count: models.length })}
        onApply={() => setChooseOpen(false)}
      />
    </>
  );

  return {
    desktopProps,
    mobileComposer,
    overlays,
    /** Opens the model picker (desktop) or Choose AIs (mobile), e.g. from "Swap model". */
    openPicker: () => (mobile ? setChooseOpen : setPickerOpen)(true),
    /** Opens "How should we answer?" (M7). */
    openModeSheet: () => setModeOpen(true),
    /** Puts the demo voice text in the composer, as after dictation (M18). */
    prefillVoice: () => {
      setValue(voiceText);
      setVoiceNote(true);
    },
  };
}
