import { ModelOrb } from "@/components/atoms/ModelOrb";
import { cx, focusRing, stateLayer } from "@/components/atoms/states";
import { Button } from "@/components/atoms/Button";
import { ReceiptStrip } from "@/components/molecules/ReceiptStrip";
import type { ModelId } from "@/lib/ai/models";

// Figma: Design system › Best answer card (103:21254): the merged best answer. Each point shows the
// logo of the model it came from (the product owner asked for logos, not written names; the name
// is the logo's accessible label and tooltip). This view combines answers for display only, it
// never sends one model's answer to another.

export interface BestAnswerPoint {
  /** Bold lead-in, e.g. "Golpo Coffee:". */
  lead: string;
  text: string;
  /** The model it came from: its logo is shown. */
  model: ModelId;
  /** e.g. "from Claude": read by screen readers and shown on hover. */
  source: string;
}

export interface BestAnswerCardProps {
  models: ModelId[];
  /** e.g. "Best answer". */
  title: string;
  /** e.g. "Built from GPT, Claude and Gemini". */
  builtFrom: string;
  intro: string;
  points: BestAnswerPoint[];
  metrics: string[];
  seeAllLabel: string;
  whyLabel: string;
  onSeeAll?: () => void;
  onWhy?: () => void;
  className?: string;
}

export function BestAnswerCard({
  models,
  title,
  builtFrom,
  intro,
  points,
  metrics,
  seeAllLabel,
  whyLabel,
  onSeeAll,
  onWhy,
  className,
}: BestAnswerCardProps) {
  return (
    <section className={cx("flex w-full flex-col gap-4", className)}>
      <header className="flex items-center gap-2">
        <span className="flex space-x-composer-orb-overlap">
          {models.map((m) => (
            <ModelOrb
              key={m}
              model={m}
              size="sm"
              sizeClassName="size-suggestion-bar-orb"
            />
          ))}
        </span>
        <h2 className="type-nav-item-selected text-ink">{title}</h2>
        <span className="rounded-pill border border-line px-3 py-1 type-caption text-ink-2">
          {builtFrom}
        </span>
      </header>
      <div className="flex flex-col gap-4 rounded-answer-card border border-line bg-surface p-6">
        <p className="type-best-answer-text text-ink">{intro}</p>
        <ul className="flex flex-col gap-2">
          {points.map((p) => (
            <li key={p.lead} className="flex items-center gap-2">
              <span className="flex-1 type-best-answer-text text-ink">
                <strong className="font-semibold">{p.lead}</strong> {p.text}
              </span>
              <ModelOrb
                model={p.model}
                size="md"
                aria-label={p.source}
                title={p.source}
              />
            </li>
          ))}
        </ul>
        <ReceiptStrip metrics={metrics} className="pt-1-5" />
      </div>
      <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm" onClick={onSeeAll}>
          {seeAllLabel}
        </Button>
        <button
          type="button"
          onClick={onWhy}
          className={cx(
            "inline-flex h-control-md items-center rounded-pill bg-blue-soft px-4 type-label text-blue",
            stateLayer,
            focusRing,
          )}
        >
          {whyLabel}
        </button>
      </div>
    </section>
  );
}
