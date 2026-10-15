import { Icon } from "@/components/atoms/Icon";
import { ModelOrb } from "@/components/atoms/ModelOrb";
import { cx } from "@/components/atoms/states";
import type { ModelId } from "@/lib/ai/models";

// Figma: Design system › Usage card (103:20960): spend by model with a stacked bar, and an
// insight. Bar colours are the model colours (model/*).

export interface UsageByModel {
  model: ModelId;
  name: string;
  credits: string;
  money: string;
  /** Share of spend, 0–100. */
  share: number;
}

export interface UsageCardProps {
  /** e.g. "BY MODEL". */
  title: string;
  /** e.g. "26 credits · ≈ BDT 0.26". */
  total: string;
  rows: UsageByModel[];
  insight: { label: string; title: string; body: string; footnote?: string };
  className?: string;
}

// Model colours exist for the five Figma models; others fall back to lum/ink-3.
const barColour: Partial<Record<ModelId, string>> = {
  gpt: "bg-model-gpt",
  claude: "bg-model-claude",
  gemini: "bg-model-gemini",
  deepseek: "bg-model-deepseek",
  grok: "bg-model-grok",
};

const card =
  "flex flex-col rounded-xl border border-line bg-surface p-6 shadow-stat-card";

export function UsageCard({
  title,
  total,
  rows,
  insight,
  className,
}: UsageCardProps) {
  return (
    <div className={cx("flex w-full items-stretch gap-4", className)}>
      <section className={cx(card, "min-w-0 flex-1 gap-4")}>
        <header className="flex items-center justify-between">
          <h3 className="type-overline text-ink-3">{title}</h3>
          <span className="type-stepper text-ink">{total}</span>
        </header>
        <div aria-hidden className="flex h-usage-bar-height gap-1">
          {rows.map((r) => (
            <span
              key={r.model}
              className={cx(
                "rounded-skeleton-line",
                barColour[r.model] ?? "bg-ink-3",
              )}
              style={{ flexGrow: r.share, flexBasis: 0 }}
            />
          ))}
        </div>
        <ul className="flex flex-col">
          {rows.map((r) => (
            <li
              key={r.model}
              className="flex h-usage-row-height items-center gap-3"
            >
              <ModelOrb
                model={r.model}
                size="sm"
                sizeClassName="size-usage-orb"
                ringOutside
              />
              <span className="flex-1 type-nav-item-selected text-ink">
                {r.name}
              </span>
              <span className="w-usage-col-credits text-right type-stepper text-ink">
                {r.credits}
              </span>
              <span className="w-usage-col-money text-right type-stepper text-ink-2">
                {r.money}
              </span>
              <span className="w-usage-col-share text-right type-stepper text-ink-3">
                {r.share}%
              </span>
            </li>
          ))}
        </ul>
      </section>
      <section className={cx(card, "w-usage-insight-width shrink-0 gap-3")}>
        <h3 className="flex items-center gap-2 type-overline text-ink-3">
          <Icon name="idea-01" className="size-icon-sm text-blue" />
          {insight.label}
        </h3>
        <p className="type-usage-insight-title text-ink">{insight.title}</p>
        <p className="type-usage-insight-body text-ink-2">{insight.body}</p>
        {insight.footnote && (
          <p className="type-caption text-ink-3">{insight.footnote}</p>
        )}
      </section>
    </div>
  );
}
