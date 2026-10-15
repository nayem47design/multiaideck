import { ModelOrb } from "@/components/atoms/ModelOrb";
import { cx, focusRing } from "@/components/atoms/states";
import type { ModelId } from "@/lib/ai/models";

// Not a Figma component yet: "Prompt 1 (collapsed)" on the Prompt 2 / Prompt 3 Compare screens.
// An earlier prompt folded to one row: its number, text, what each model returned (its logo and
// cost), and Show / Hide.

export interface PromptSummaryResult {
  model: ModelId;
  /** e.g. "1.4 cr" or "refunded": the model is shown by its logo (whose label is its name). */
  label: string;
  /** Refunded results are drawn in ink-2. */
  refunded?: boolean;
}

export interface PromptSummaryProps {
  /** e.g. "Prompt 1". */
  label: string;
  prompt: string;
  results: PromptSummaryResult[];
  /** e.g. "Show" / "Hide". */
  toggleLabel: string;
  expanded?: boolean;
  onToggle?: () => void;
  className?: string;
}

export function PromptSummary({
  label,
  prompt,
  results,
  toggleLabel,
  expanded,
  onToggle,
  className,
}: PromptSummaryProps) {
  return (
    <div
      className={cx(
        "flex min-h-chat-summary-height items-center gap-3 rounded-chat-summary border border-line bg-surface py-chat-summary-pad-y pr-3 pl-4",
        className,
      )}
    >
      <span className="shrink-0 type-label text-ink-2">{label}</span>
      <span className="min-w-0 flex-1 truncate type-ui text-ink">{prompt}</span>
      <ul className="flex shrink-0 items-center gap-3 max-lg:hidden">
        {results.map((r) => (
          <li
            key={r.model}
            className="inline-flex h-chat-summary-chip items-center gap-1-5 rounded-pill bg-canvas pr-chat-summary-chip-pad pl-2"
          >
            <ModelOrb model={r.model} size="sm" />
            <span
              className={cx(
                "type-caption",
                r.refunded ? "text-ink-2" : "text-ink",
              )}
            >
              {r.label}
            </span>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className={cx(
          "shrink-0 rounded-xs type-ui-strong text-blue hover:underline",
          focusRing,
        )}
      >
        {toggleLabel}
      </button>
    </div>
  );
}
