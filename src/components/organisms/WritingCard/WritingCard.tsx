import { ModelOrb } from "@/components/atoms/ModelOrb";
import { cx } from "@/components/atoms/states";
import { ThinkingDots } from "@/components/atoms/ThinkingDots";
import type { ModelId } from "@/lib/ai/models";

// Not a Figma component yet: the "Writing · <model>" placeholder on the Compare thinking screens
// (Thinking · Compare, Thinking · Prompt 2, Thinking · Prompt 3). It holds an Answer card's place
// while that model writes. Skeleton line widths follow Figma (300 / 280 / 310 / 220 / 290 / 180
// of 320).

export interface WritingCardProps {
  model: ModelId;
  /** e.g. "GPT-5". */
  modelName: string;
  /** e.g. "OpenAI". */
  provider: string;
  /** e.g. "Writing…", "Taking longer than usual…", "Not responding". */
  status: string;
  /** Replaces the card's size classes (Answer card size by default). */
  sizeClassName?: string;
  className?: string;
}

const LINES = ["w-15/16", "w-7/8", "w-full", "w-11/16", "w-9/10", "w-9/16"];

export function WritingCard({
  model,
  modelName,
  provider,
  status,
  sizeClassName,
  className,
}: WritingCardProps) {
  return (
    <article
      aria-busy
      className={cx(
        "flex flex-col gap-chat-writing-gap rounded-xl border border-line bg-surface p-5",
        sizeClassName ?? "h-answer-card-height w-answer-card-width",
        className,
      )}
    >
      <header className="flex items-center gap-chat-writing-header-gap">
        <ModelOrb model={model} />
        <div className="flex flex-col gap-0-5">
          <h3 className="type-chat-writing-model text-ink">{modelName}</h3>
          <p className="type-caption text-ink-2">{provider}</p>
        </div>
      </header>
      <p className="flex items-center gap-2 type-ui text-ink-2">
        <ThinkingDots label="" state="composing" aria-hidden role={undefined} />
        <span role="status">{status}</span>
      </p>
      <div aria-hidden className="flex flex-col gap-chat-writing-gap">
        {LINES.map((w) => (
          <span
            key={w}
            className={cx(
              "block h-skeleton-line rounded-skeleton-line bg-canvas",
              w,
            )}
          />
        ))}
      </div>
    </article>
  );
}
