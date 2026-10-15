"use client";

import { Dialog } from "radix-ui";

import { Icon, type IconName } from "@/components/atoms/Icon";
import { cx, focusRing, stateLayer } from "@/components/atoms/states";
import { AiOrbGroup } from "@/components/molecules/AiOrbGroup";

// Not a Figma component yet: M4 · Voice: listening. Full screen on mobile: the words so far, a
// waveform, and Cancel / Done / Pause. Done puts the words in the composer to check (M18).

export interface VoiceCaptureProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** e.g. "Listening…". */
  title: string;
  transcript: string;
  /** Recent input levels, 0–1 each. */
  levels: number[];
  /** e.g. "English". */
  language: string;
  labels: {
    close: string;
    language: string;
    cancel: string;
    done: string;
    pause: string;
    /** e.g. "Speak naturally. Tap Done, check the words, then send." */
    hint: string;
  };
  paused?: boolean;
  onLanguage?: () => void;
  onDone?: () => void;
  onPause?: () => void;
}

function RoundButton({
  icon,
  label,
  onClick,
  primary,
}: {
  icon: IconName;
  label: string;
  onClick?: () => void;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "group flex flex-col items-center gap-2 rounded-lg",
        focusRing,
      )}
    >
      <span
        className={cx(
          "relative isolate flex items-center justify-center overflow-hidden rounded-pill",
          "after:absolute after:inset-0 after:-z-10 after:bg-current after:opacity-0 group-hover:after:opacity-8 group-active:after:opacity-14",
          primary
            ? "size-chat-voice-done bg-cta text-on-cta"
            : "size-16 border border-line bg-surface text-ink",
        )}
      >
        <Icon
          name={icon}
          className={
            primary ? "size-chat-voice-done-icon" : "size-chat-voice-icon"
          }
        />
      </span>
      <span className="type-ui-strong text-ink-2">{label}</span>
    </button>
  );
}

export function VoiceCapture({
  open,
  onOpenChange,
  title,
  transcript,
  levels,
  language,
  labels,
  paused,
  onLanguage,
  onDone,
  onPause,
}: VoiceCaptureProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Content
          aria-describedby={undefined}
          onOpenAutoFocus={(e) => e.preventDefault()}
          className="fixed inset-0 z-50 flex flex-col bg-canvas outline-none"
        >
          <div className="flex h-mobile-top-bar-height shrink-0 items-center justify-between px-2">
            <Dialog.Close
              aria-label={labels.close}
              className={cx(
                "flex size-mobile-tap items-center justify-center rounded-pill text-ink",
                stateLayer,
                focusRing,
              )}
            >
              <Icon name="cancel-01" className="size-mobile-tap-icon" />
            </Dialog.Close>
            <button
              type="button"
              onClick={onLanguage}
              aria-label={`${labels.language}: ${language}`}
              className={cx(
                "inline-flex h-10 items-center gap-1-5 rounded-pill border border-line bg-surface px-chat-m-pill-pad type-chat-m-strong text-ink",
                stateLayer,
                focusRing,
              )}
            >
              <Icon
                name="globe-02"
                className="size-icon-button-icon text-ink-2"
              />
              {language}
              <Icon name="arrow-down-01" className="size-icon-sm text-ink-2" />
            </button>
            <span className="size-mobile-tap" />
          </div>
          <div className="flex min-h-0 flex-1 flex-col items-center gap-5 overflow-y-auto px-4 pt-4">
            <AiOrbGroup size="xl" />
            <Dialog.Title className="type-chat-m-voice-title text-ink">
              {title}
            </Dialog.Title>
            <span aria-hidden className="flex h-12 items-center gap-1">
              {levels.map((level, i) => (
                <span
                  key={i}
                  className={cx(
                    "w-chat-voice-bar rounded-pill bg-blue",
                    !paused && "motion-safe:animate-pulse",
                  )}
                  style={{
                    height: `calc(var(--spacing-12) * ${Math.max(0.12, level)})`,
                  }}
                />
              ))}
            </span>
            <p
              aria-live="polite"
              className="w-full rounded-lg border border-line bg-surface p-4 type-chat-m-transcript text-ink"
            >
              {transcript}
            </p>
          </div>
          <div className="flex shrink-0 items-start justify-center gap-10 py-2">
            <div className="pt-2">
              <RoundButton
                icon="cancel-01"
                label={labels.cancel}
                onClick={() => onOpenChange(false)}
              />
            </div>
            <RoundButton
              icon="tick-02"
              label={labels.done}
              onClick={onDone}
              primary
            />
            <div className="pt-2">
              <RoundButton icon="stop" label={labels.pause} onClick={onPause} />
            </div>
          </div>
          <p className="shrink-0 px-8 pt-6 pb-[max(var(--spacing-6),env(safe-area-inset-bottom))] text-center type-ui text-ink-2">
            {labels.hint}
          </p>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
