import { ModelOrb } from "@/components/atoms/ModelOrb";
import { cx } from "@/components/atoms/states";
import type { ModelId } from "@/lib/ai/models";

// Figma: Prototype › M13 · Usage › "By AI": each model's credits and share, with a bar in the
// model's colour (model/*).

export interface ModelSpendRow {
  model: ModelId;
  name: string;
  /** e.g. "11 credits". */
  credits: string;
  /** Share of spend, 0–100. */
  share: number;
  /** e.g. "42%". */
  shareLabel: string;
}

export interface ModelSpendCardProps {
  title: string;
  rows: ModelSpendRow[];
  className?: string;
}

const barColour: Partial<Record<ModelId, string>> = {
  gpt: "bg-model-gpt",
  claude: "bg-model-claude",
  gemini: "bg-model-gemini",
  deepseek: "bg-model-deepseek",
  grok: "bg-model-grok",
};

export function ModelSpendCard({
  title,
  rows,
  className,
}: ModelSpendCardProps) {
  return (
    <section
      className={cx(
        "flex flex-col gap-3 rounded-lg border border-line bg-surface p-acct-usage-card-pad",
        className,
      )}
    >
      <h2 className="type-acct-card-title text-ink">{title}</h2>
      <ul className="flex flex-col gap-3">
        {rows.map((row) => (
          <li key={row.model} className="flex flex-col gap-1-5">
            <p className="flex items-center gap-2">
              <ModelOrb model={row.model} size="sm" />
              <span className="min-w-0 flex-1 truncate type-ui-strong text-ink">
                {row.name}
              </span>
              <span className="type-ui text-ink-2">{row.credits}</span>
              <span className="type-ui-strong text-ink">{row.shareLabel}</span>
            </p>
            <span
              aria-hidden
              className="block h-acct-usage-track overflow-hidden rounded-acct-usage-track bg-canvas"
            >
              <span
                className={cx(
                  "block h-full rounded-acct-usage-track",
                  barColour[row.model] ?? "bg-ink-3",
                )}
                style={{ width: `${row.share}%` }}
              />
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
