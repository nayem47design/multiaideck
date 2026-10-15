import { ModelOrb } from "@/components/atoms/ModelOrb";
import { cx, focusRing, stateLayer } from "@/components/atoms/states";
import type { ModelId } from "@/lib/ai/models";

// Figma: Design system › Suggestion bar (28:8632): shown when all answers are in.

export interface SuggestionBarProps {
  models: ModelId[];
  /** e.g. "3 answers ready." */
  title: string;
  /** e.g. "MultiAI suggests Claude: most complete, mid cost." */
  message: string;
  /** e.g. "Why?" */
  whyLabel: string;
  onWhy?: () => void;
  className?: string;
}

export function SuggestionBar({
  models,
  title,
  message,
  whyLabel,
  onWhy,
  className,
}: SuggestionBarProps) {
  return (
    <div
      role="status"
      className={cx(
        "inline-flex h-control-lg items-center gap-2 rounded-pill border border-glass-rim glass-strong pr-1-5 pl-2 shadow-suggestion-bar",
        className,
      )}
    >
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
      <span className="type-ui-strong text-ink">{title}</span>
      <span className="type-ui text-ink-2">{message}</span>
      <button
        type="button"
        onClick={onWhy}
        className={cx(
          "inline-flex h-suggestion-bar-why-height items-center rounded-pill bg-blue-soft px-3 type-label text-blue",
          stateLayer,
          focusRing,
        )}
      >
        {whyLabel}
      </button>
    </div>
  );
}
