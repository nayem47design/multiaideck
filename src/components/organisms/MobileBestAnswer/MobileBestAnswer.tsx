import { Icon, type IconName } from "@/components/atoms/Icon";
import { ModelOrb } from "@/components/atoms/ModelOrb";
import { cx, focusRing, stateLayer } from "@/components/atoms/states";
import type { ModelId } from "@/lib/ai/models";

// Not a Figma component yet: the merged answer on M5 · Best answer. The mobile counterpart of the
// Best answer card: each idea shows the logo of the AI it came from; this view combines answers for display
// only and never sends one AI's answer to another.

export interface MobileBestIdea {
  name: string;
  /** The AI it came from: its logo is shown. */
  model: ModelId;
  /** e.g. "from Claude": read by screen readers. */
  source: string;
  text: string;
}

export interface MobileBestAnswerProps {
  models: ModelId[];
  /** e.g. "Best answer". */
  title: string;
  /** e.g. "from 3 AIs". */
  subtitle: string;
  intro: string;
  ideas: MobileBestIdea[];
  /** e.g. "2.8 credits". */
  cost: string;
  /** e.g. "(৳0.03)". */
  money: string;
  labels: {
    copy: string;
    share: string;
    helpful: string;
    notHelpful: string;
    /** e.g. "See all 3 answers". */
    seeAll: string;
  };
  onCopy?: () => void;
  onShare?: () => void;
  onHelpful?: () => void;
  onNotHelpful?: () => void;
  onSeeAll?: () => void;
  className?: string;
}

const tap = cx(
  "flex size-10 shrink-0 items-center justify-center rounded-pill text-ink-2",
  stateLayer,
  focusRing,
);

export function MobileBestAnswer({
  models,
  title,
  subtitle,
  intro,
  ideas,
  cost,
  money,
  labels,
  onCopy,
  onShare,
  onHelpful,
  onNotHelpful,
  onSeeAll,
  className,
}: MobileBestAnswerProps) {
  const actions: { icon: IconName; label: string; onClick?: () => void }[] = [
    { icon: "copy-01", label: labels.copy, onClick: onCopy },
    { icon: "share-01", label: labels.share, onClick: onShare },
    { icon: "thumbs-up", label: labels.helpful, onClick: onHelpful },
    { icon: "thumbs-down", label: labels.notHelpful, onClick: onNotHelpful },
  ];
  return (
    <section className={cx("flex w-full flex-col", className)}>
      <header className="flex items-center gap-2">
        <span className="flex space-x-composer-orb-overlap">
          {models.map((m) => (
            <ModelOrb key={m} model={m} size="md" />
          ))}
        </span>
        <h2 className="type-chat-m-strong text-ink">{title}</h2>
        <span className="type-ui text-ink-2">{subtitle}</span>
      </header>
      <div className="mt-4 flex flex-col gap-3 rounded-lg border border-line bg-surface p-4">
        <p className="type-body text-ink">{intro}</p>
        {ideas.map((idea) => (
          <div key={idea.name} className="flex flex-col gap-1">
            <p className="flex flex-wrap items-center gap-x-2">
              <span className="type-chat-m-name text-ink">{idea.name}</span>
              <ModelOrb model={idea.model} size="md" aria-label={idea.source} />
            </p>
            <p className="type-ui text-ink-2">{idea.text}</p>
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center justify-between">
        <p className="flex items-center gap-1-5 type-ui text-ink-2">
          <Icon name="coins-01" className="size-icon-sm text-ink-3" />
          <span>{cost}</span>
          <span>{money}</span>
        </p>
        <div className="flex">
          {actions.map((a) => (
            <button
              key={a.icon}
              type="button"
              aria-label={a.label}
              title={a.label}
              onClick={a.onClick}
              className={tap}
            >
              <Icon name={a.icon} className="size-icon-md" />
            </button>
          ))}
        </div>
      </div>
      <button
        type="button"
        onClick={onSeeAll}
        className={cx(
          "mt-2 inline-flex h-12 w-full items-center justify-center gap-2 rounded-pill border border-line bg-surface px-5 type-chat-m-strong text-ink",
          stateLayer,
          focusRing,
        )}
      >
        <Icon name="layers-01" className="size-icon-md text-ink-2" />
        {labels.seeAll}
      </button>
    </section>
  );
}
