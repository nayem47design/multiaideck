import type { ReactElement, ReactNode, TextareaHTMLAttributes } from "react";

import { Icon } from "@/components/atoms/Icon";
import { IconButton } from "@/components/atoms/IconButton";
import { ModelOrb } from "@/components/atoms/ModelOrb";
import { ProgressBar } from "@/components/atoms/ProgressBar";
import { cx, focusRing, stateLayer } from "@/components/atoms/states";
import { CostEstimate } from "@/components/molecules/CostEstimate";
import {
  SegmentedControl,
  type SegmentedOption,
} from "@/components/molecules/SegmentedControl";
import type { ModelId } from "@/lib/ai/models";

// Figma: Design system › Composer (147:39061). State mirrors Figma: Default, Voice listening,
// Attachment (shown whenever there are attachments).

export type ComposerState = "default" | "voice-listening";

export interface ComposerAttachment {
  id: string;
  name: string;
  kind: "file" | "image";
  /** e.g. "PDF · 1.2 MB", or while uploading "Uploading · 64%". */
  meta: string;
  /** 0–100 while uploading. */
  progress?: number;
}

export interface ComposerVoice {
  transcript: string;
  /** e.g. "Listening". */
  status: string;
  /** e.g. "0:07". */
  elapsed: string;
  /** e.g. "English". */
  language: string;
  /** Recent input levels, 0–1 each; quiet bars are drawn in lum/line. */
  levels: number[];
}

export interface ComposerLabels {
  attach: string;
  voice: string;
  send: string;
  cancelVoice: string;
  doneVoice: string;
  /** e.g. "3 models". */
  models: string;
  modeGroup: string;
  removeAttachment: (name: string) => string;
  language: string;
}

export interface ComposerProps extends Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  "onChange" | "value"
> {
  /** Animated glowing border (effects.css › glow-border): light travels around the border. */
  glow?: boolean;
  state?: ComposerState;
  value: string;
  onValueChange: (value: string) => void;
  modes: SegmentedOption[];
  mode: string;
  onModeChange: (mode: string) => void;
  models: ModelId[];
  /** e.g. "≈ 2 to 4 cr". */
  estimate?: string;
  attachments?: ComposerAttachment[];
  voice?: ComposerVoice;
  labels: ComposerLabels;
  onAttach?: () => void;
  /**
   * Wraps the "+" button, e.g. in a <ComposerMenu> so the button opens the "+" menu (Figma:
   * Composer menu 147:38907). Receives the button; returns what to render in its place.
   */
  attachMenu?: (button: ReactElement) => ReactNode;
  onPickModels?: () => void;
  onVoice?: () => void;
  onSend?: () => void;
  onRemoveAttachment?: (id: string) => void;
  onCancelVoice?: () => void;
  onDoneVoice?: () => void;
  onLanguage?: () => void;
}

export function Composer({
  state = "default",
  value,
  onValueChange,
  modes,
  mode,
  onModeChange,
  models,
  estimate,
  attachments = [],
  voice,
  labels,
  onAttach,
  attachMenu,
  onPickModels,
  onVoice,
  onSend,
  onRemoveAttachment,
  onCancelVoice,
  onDoneVoice,
  onLanguage,
  className,
  glow = false,
  ...textarea
}: ComposerProps) {
  const listening = state === "voice-listening" && voice;
  return (
    <div
      className={cx(
        "flex w-full flex-col gap-4 rounded-composer border border-glass-rim glass-strong pt-4 pr-4 pb-3 pl-5 shadow-composer",
        glow && "glow-border [--glow-radius:var(--composer-radius)]",
        className,
      )}
    >
      {glow && <span className="glow-border__halo" aria-hidden />}
      {!listening && attachments.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {attachments.map((file) => (
            <li
              key={file.id}
              className="flex w-composer-file-width items-center gap-composer-file-gap rounded-md border border-line bg-surface py-2 pr-composer-file-pad-right pl-2"
            >
              <span
                className={cx(
                  "flex size-control-md shrink-0 items-center justify-center rounded-composer-file-tile text-ink-2",
                  file.kind === "image" ? "bg-blue-soft" : "bg-canvas",
                )}
              >
                <Icon
                  name={file.kind === "image" ? "image-01" : "file-02"}
                  className="size-icon-button-icon"
                />
              </span>
              <span className="flex w-composer-file-text flex-col gap-1">
                <span className="truncate type-ui-strong text-ink">
                  {file.name}
                </span>
                {file.progress !== undefined && (
                  <ProgressBar value={file.progress} aria-label={file.meta} />
                )}
                <span className="type-caption text-ink-2">{file.meta}</span>
              </span>
              <button
                type="button"
                aria-label={labels.removeAttachment(file.name)}
                onClick={() => onRemoveAttachment?.(file.id)}
                className={cx(
                  "rounded-pill text-ink-2 hover:text-ink",
                  focusRing,
                )}
              >
                <Icon name="cancel-01" className="size-icon-sm" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {listening ? (
        <p className="type-composer-input text-ink">{voice.transcript}</p>
      ) : (
        <textarea
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          rows={1}
          className="field-sizing-content w-full resize-none bg-transparent type-composer-input text-ink outline-none placeholder:text-ink-3"
          {...textarea}
        />
      )}

      <div className="flex items-center gap-2">
        {listening ? (
          <>
            <IconButton
              variant="outline"
              icon="cancel-01"
              label={labels.cancelVoice}
              onClick={onCancelVoice}
            />
            <span className="flex items-center gap-2">
              <span
                aria-hidden
                className="size-2 rounded-pill bg-blue motion-safe:animate-pulse"
              />
              <span className="type-ui-strong text-ink">{voice.status}</span>
              <span className="type-mono text-ink-2">{voice.elapsed}</span>
            </span>
            <span
              aria-hidden
              className="flex h-composer-wave-max items-center gap-composer-wave-gap"
            >
              {voice.levels.map((level, i) => (
                <span
                  key={i}
                  className={cx(
                    "w-composer-wave-bar rounded-pill",
                    level > 0.15 ? "bg-blue" : "bg-line",
                  )}
                  style={{
                    height: `calc(var(--composer-wave-max) * ${Math.max(0.15, level)})`,
                  }}
                />
              ))}
            </span>
            <button
              type="button"
              onClick={onLanguage}
              aria-label={labels.language}
              className={cx(
                "inline-flex items-center gap-1 rounded-pill px-composer-language-pad-x py-1-5 type-label text-ink ring-1 ring-line ring-inset",
                focusRing,
              )}
            >
              {voice.language}
              <Icon
                name="arrow-down-01"
                className="size-select-icon text-ink-2"
              />
            </button>
            <span className="flex-1" />
            <IconButton
              variant="send"
              icon="tick-02"
              label={labels.doneVoice}
              onClick={onDoneVoice}
            />
          </>
        ) : (
          <>
            {(attachMenu ?? ((button: ReactElement) => button))(
              <IconButton
                variant="outline"
                icon="add-01"
                label={labels.attach}
                onClick={onAttach}
              />,
            )}
            <SegmentedControl
              options={modes}
              value={mode}
              onValueChange={onModeChange}
              label={labels.modeGroup}
            />
            <button
              type="button"
              onClick={onPickModels}
              className={cx(
                "inline-flex h-control-md items-center gap-2 rounded-pill pr-2 pl-3 type-label text-ink ring-1 ring-line ring-inset",
                stateLayer,
                focusRing,
              )}
            >
              <span className="flex space-x-composer-orb-overlap">
                {models.map((m) => (
                  <ModelOrb key={m} model={m} size="md" />
                ))}
              </span>
              {labels.models}
              <Icon name="add-01" className="size-select-icon text-ink-3" />
            </button>
            <span className="flex-1" />
            {estimate && <CostEstimate>{estimate}</CostEstimate>}
            <IconButton icon="mic-01" label={labels.voice} onClick={onVoice} />
            <IconButton variant="send" label={labels.send} onClick={onSend} />
          </>
        )}
      </div>
    </div>
  );
}
