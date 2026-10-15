import type { ReactNode } from "react";

import { Button } from "@/components/atoms/Button";
import { Divider } from "@/components/atoms/Divider";
import { Icon } from "@/components/atoms/Icon";
import { IconButton } from "@/components/atoms/IconButton";
import { ModelOrb } from "@/components/atoms/ModelOrb";
import { cx } from "@/components/atoms/states";
import type { BadgeTone } from "@/components/atoms/Badge";
import { ReceiptStrip } from "@/components/molecules/ReceiptStrip";
import type { ModelId } from "@/lib/ai/models";

// Figma: Design system › Answer card (103:25291). State mirrors Figma: Suggested (blue border,
// tinted Continue), Default, Failed (refunded, retry). Each card shows one model's answer only.

export type AnswerCardState = "suggested" | "default" | "failed";

export interface AnswerCardLabels {
  close: string;
  copy: string;
  retry: string;
  helpful: string;
  notHelpful: string;
  /** e.g. "Continue with Claude". */
  continue: string;
  /** Failed only, e.g. "Swap model". */
  swapModel?: string;
  /** Failed only, e.g. "Retry · ≈ 0.9 cr". */
  retryWithCost?: string;
}

export interface AnswerCardProps {
  state: AnswerCardState;
  model: ModelId;
  /** e.g. "Claude Sonnet 4". */
  modelName: string;
  /** e.g. "Anthropic". */
  provider: string;
  /** The answer, or for Failed the explanation. */
  children: ReactNode;
  /** e.g. ["2.6 s", "142 tokens", "1.4 cr"]. Not shown when Failed. */
  metrics?: string[];
  /** Badge after the metrics, e.g. "Suggested", or for Failed "Couldn’t answer". */
  badge?: string;
  /** Failed only, e.g. "Refunded · 0 cr". */
  refund?: string;
  /**
   * Badge tone when not Failed. Defaults to Info; screens use Success ("Fastest · Cheapest") and
   * Neutral ("Caught up", "Answered on retry").
   */
  badgeTone?: BadgeTone;
  /** Replaces the card's size classes (Figma's 360×520), e.g. to fill a grid column. */
  sizeClassName?: string;
  labels: AnswerCardLabels;
  onClose?: () => void;
  onCopy?: () => void;
  onRetry?: () => void;
  onHelpful?: () => void;
  onNotHelpful?: () => void;
  onContinue?: () => void;
  onSwapModel?: () => void;
  onChangeModel?: () => void;
  className?: string;
}

export function AnswerCard({
  state,
  model,
  modelName,
  provider,
  children,
  metrics = [],
  badge,
  refund,
  badgeTone = "info",
  sizeClassName,
  labels,
  onClose,
  onCopy,
  onRetry,
  onHelpful,
  onNotHelpful,
  onContinue,
  onSwapModel,
  onChangeModel,
  className,
}: AnswerCardProps) {
  const failed = state === "failed";
  return (
    <article
      className={cx(
        "flex flex-col overflow-hidden rounded-answer-card bg-surface shadow-answer-card ring-inset",
        sizeClassName ?? "h-answer-card-height w-answer-card-width",
        // Figma includes the stroke in the layout: content sits inside it.
        state === "suggested"
          ? "p-(--answer-card-border-suggested-width) ring-(length:--answer-card-border-suggested-width) ring-blue"
          : "p-px ring-1 ring-line",
        className,
      )}
    >
      <header className="flex items-center gap-2 pt-4 pr-3 pb-3 pl-4">
        <ModelOrb model={model} />
        <div className="flex min-w-0 flex-1 flex-col">
          <button
            type="button"
            onClick={onChangeModel}
            className="flex items-center gap-1 self-start type-answer-card-model text-ink"
          >
            {modelName}
            <Icon
              name="arrow-down-01"
              className="size-select-icon text-ink-3"
            />
          </button>
          <p className="type-caption text-ink-3">{provider}</p>
        </div>
        <IconButton icon="cancel-01" label={labels.close} onClick={onClose} />
      </header>

      <div
        className={cx(
          "flex items-center px-4 pb-3",
          failed && "gap-answer-card-receipt-gap-failed",
        )}
      >
        <ReceiptStrip
          metrics={failed ? [] : metrics}
          badge={
            badge
              ? { tone: failed ? "error" : badgeTone, label: badge }
              : undefined
          }
        />
        {failed && refund && (
          <span className="type-mono text-ink-2">{refund}</span>
        )}
      </div>

      <Divider />

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {failed && (
          <span className="flex size-10 items-center justify-center rounded-answer-card-failure bg-canvas text-ink-2">
            <Icon name="alert-circle" className="size-icon-md" />
          </span>
        )}
        <div
          className={cx(
            "type-answer-card-answer whitespace-pre-line",
            failed ? "text-ink-2" : "text-ink",
          )}
        >
          {children}
        </div>
      </div>

      <footer className="flex items-center gap-0-5 p-3">
        {!failed && (
          <>
            <IconButton
              icon="copy-01"
              label={labels.copy}
              onClick={onCopy}
              sizeClassName="size-control-sm"
            />
            <IconButton
              icon="reload"
              label={labels.retry}
              onClick={onRetry}
              sizeClassName="size-control-sm"
            />
            <IconButton
              icon="thumbs-up"
              label={labels.helpful}
              onClick={onHelpful}
              sizeClassName="size-control-sm"
            />
            <IconButton
              icon="thumbs-down"
              label={labels.notHelpful}
              onClick={onNotHelpful}
              sizeClassName="size-control-sm"
            />
          </>
        )}
        <span className="flex-1" />
        {failed ? (
          <>
            <Button variant="ghost" size="sm" onClick={onSwapModel}>
              {labels.swapModel}
            </Button>
            <Button variant="secondary" size="sm" onClick={onRetry}>
              {labels.retryWithCost}
            </Button>
          </>
        ) : (
          <Button
            variant={state === "suggested" ? "tinted" : "secondary"}
            size="sm"
            onClick={onContinue}
          >
            {labels.continue}
          </Button>
        )}
      </footer>
    </article>
  );
}
