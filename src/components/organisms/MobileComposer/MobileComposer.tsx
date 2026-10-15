import type { TextareaHTMLAttributes } from "react";

import { Icon } from "@/components/atoms/Icon";
import { cx, focusRing, stateLayer } from "@/components/atoms/states";

// Not a Figma component yet: the "Mobile composer" on the M-screens (M2, M5, M6, M18, M19…).
// 44px tap targets: add (opens the "+" sheet), the mode chip (opens "How should we answer?"),
// voice and send. Shows a "From your voice" note after dictation (M18) and an attached file (M19).

export interface MobileComposerFile {
  id: string;
  name: string;
  kind: "file" | "image";
  /** e.g. "PDF · 1.2 MB · ready". */
  meta: string;
}

export interface MobileComposerLabels {
  add: string;
  /** Accessible name of the mode chip, e.g. "Answer mode". */
  mode: string;
  voice: string;
  send: string;
  removeFile: (name: string) => string;
}

export interface MobileComposerProps extends Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  "onChange" | "value"
> {
  value: string;
  onValueChange: (value: string) => void;
  /** Current mode, e.g. "Best answer". */
  modeLabel: string;
  labels: MobileComposerLabels;
  /** e.g. "From your voice. Check the words, then tap Send." */
  voiceNote?: string;
  files?: MobileComposerFile[];
  onAdd?: () => void;
  onMode?: () => void;
  onVoice?: () => void;
  onSend?: () => void;
  onRemoveFile?: (id: string) => void;
}

const tap = cx(
  "flex size-control-lg shrink-0 items-center justify-center rounded-pill",
  stateLayer,
  focusRing,
);

export function MobileComposer({
  value,
  onValueChange,
  modeLabel,
  labels,
  voiceNote,
  files = [],
  onAdd,
  onMode,
  onVoice,
  onSend,
  onRemoveFile,
  className,
  ...textarea
}: MobileComposerProps) {
  return (
    <div
      className={cx(
        "flex w-full flex-col gap-chat-m-composer-gap rounded-xl border border-glass-rim glass-strong px-chat-m-composer-pad-x py-3 shadow-composer",
        className,
      )}
    >
      {voiceNote && (
        <p className="flex min-h-chat-m-voice-note-h items-center gap-1-5 rounded-chat-m-file bg-blue-soft px-chat-m-voice-note-pad py-1 type-chat-m-voice-note text-blue">
          <Icon name="mic-01" className="size-select-icon shrink-0" />
          <span>{voiceNote}</span>
        </p>
      )}
      {files.map((file) => (
        <div
          key={file.id}
          className="flex items-center gap-chat-m-file-gap rounded-chat-m-file border border-line bg-surface p-2"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-sm bg-canvas text-ink-2">
            <Icon
              name={file.kind === "image" ? "image-01" : "file-02"}
              className="size-icon-md"
            />
          </span>
          <span className="flex min-w-0 flex-1 flex-col gap-0-5">
            <span className="truncate type-chat-m-strong text-ink">
              {file.name}
            </span>
            <span className="type-ui text-ink-2">{file.meta}</span>
          </span>
          <button
            type="button"
            aria-label={labels.removeFile(file.name)}
            onClick={() => onRemoveFile?.(file.id)}
            className={cx(
              "flex size-10 shrink-0 items-center justify-center rounded-pill text-ink-2",
              stateLayer,
              focusRing,
            )}
          >
            <Icon name="cancel-01" className="size-icon-md" />
          </button>
        </div>
      ))}
      <textarea
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        rows={1}
        className="field-sizing-content w-full resize-none bg-transparent type-body text-ink outline-none placeholder:text-ink-3"
        {...textarea}
      />
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label={labels.add}
          title={labels.add}
          onClick={onAdd}
          className={cx(tap, "border border-line text-ink-2")}
        >
          <Icon name="add-01" className="size-mobile-tap-icon" />
        </button>
        <button
          type="button"
          aria-label={`${labels.mode}: ${modeLabel}`}
          aria-haspopup="dialog"
          onClick={onMode}
          className={cx(
            "inline-flex h-control-md min-w-0 items-center gap-1 rounded-pill bg-canvas px-3 type-ui-strong text-ink",
            stateLayer,
            focusRing,
          )}
        >
          <span className="truncate">{modeLabel}</span>
          <Icon
            name="arrow-down-01"
            className="size-icon-sm shrink-0 text-ink-2"
          />
        </button>
        <span className="flex-1" />
        <button
          type="button"
          aria-label={labels.voice}
          title={labels.voice}
          onClick={onVoice}
          className={cx(tap, "bg-blue-soft text-blue")}
        >
          <Icon name="mic-01" className="size-mobile-tap-icon" />
        </button>
        <button
          type="button"
          aria-label={labels.send}
          title={labels.send}
          onClick={onSend}
          className={cx(tap, "bg-cta text-on-cta")}
        >
          <Icon name="arrow-up-02" className="size-mobile-tap-icon" />
        </button>
      </div>
    </div>
  );
}
