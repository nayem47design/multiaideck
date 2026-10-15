import type { ReactNode } from "react";

import { Icon, type IconName } from "@/components/atoms/Icon";
import { ModelOrb } from "@/components/atoms/ModelOrb";
import { cx, focusRing, stateLayer } from "@/components/atoms/states";
import type { ModelId } from "@/lib/ai/models";

// Not a Figma component yet: "Answer card · <model>" on mobile Compare (M6, M23, M24, M27, M29,
// M31–M33) and its failed form (M8, M28). One AI's answer, full width, with an optional note
// ("Suggested: …", "Fastest and cheapest of the three") and "Use this answer". Failed cards say
// what happened, that nothing was charged, and offer a retry or another AI.

export type MobileAnswerNoteTone = "info" | "success";

export interface MobileAnswerAction {
  label: string;
  icon?: IconName;
  /** "tinted": blue-soft (the suggested next step); "secondary": outlined. */
  tone: "tinted" | "secondary";
  onClick?: () => void;
}

interface Common {
  model: ModelId;
  className?: string;
  id?: string;
}

export interface MobileAnswerCardAnswered extends Common {
  state?: "answered";
  /** e.g. "Claude Sonnet 4". */
  modelName: string;
  /** e.g. "2.6 seconds · 1.4 credits (৳0.01)". */
  meta: string;
  note?: { tone: MobileAnswerNoteTone; text: string };
  /** Suggested answers get a blue border. */
  suggested?: boolean;
  children: ReactNode;
  labels: {
    copy: string;
    helpful: string;
    notHelpful: string;
    use: string;
  };
  onCopy?: () => void;
  onHelpful?: () => void;
  onNotHelpful?: () => void;
  onUse?: () => void;
}

export interface MobileAnswerCardFailed extends Common {
  state: "failed";
  /** e.g. "GPT-5 couldn’t answer this time". */
  title: string;
  body: string;
  /** e.g. "You were not charged for this." */
  refund: string;
  actions: MobileAnswerAction[];
}

export type MobileAnswerCardProps =
  MobileAnswerCardAnswered | MobileAnswerCardFailed;

const tap = cx(
  "flex size-10 shrink-0 items-center justify-center rounded-pill text-ink-2",
  stateLayer,
  focusRing,
);

const actionTone = {
  tinted: "bg-blue-soft text-blue",
  secondary: "border border-line bg-surface text-ink",
};

export function MobileAnswerCard(props: MobileAnswerCardProps) {
  if (props.state === "failed") {
    const { title, body, refund, actions, className, id } = props;
    return (
      <article
        id={id}
        className={cx(
          "flex flex-col gap-chat-m-failed-gap rounded-xl border border-line bg-surface p-5",
          className,
        )}
      >
        <span className="flex size-12 items-center justify-center rounded-md bg-canvas text-ink-2">
          <Icon name="alert-circle" className="size-mobile-tap-icon" />
        </span>
        <h3 className="type-heading text-ink">{title}</h3>
        <p className="type-body text-ink-2">{body}</p>
        <p className="flex items-center gap-2 rounded-md bg-status-success-soft px-3 py-chat-m-refund-pad-y type-chat-m-strong text-success">
          <Icon name="tick-02" className="size-icon-button-icon shrink-0" />
          {refund}
        </p>
        {actions.map((a) => (
          <button
            key={a.label}
            type="button"
            onClick={a.onClick}
            className={cx(
              "inline-flex h-chat-m-button w-full items-center justify-center gap-2 rounded-pill px-5 type-chat-m-strong",
              actionTone[a.tone],
              stateLayer,
              focusRing,
            )}
          >
            {a.icon && <Icon name={a.icon} className="size-icon-md" />}
            {a.label}
          </button>
        ))}
      </article>
    );
  }

  const {
    model,
    modelName,
    meta,
    note,
    suggested,
    children,
    labels,
    onCopy,
    onHelpful,
    onNotHelpful,
    onUse,
    className,
    id,
  } = props;
  return (
    <article
      id={id}
      className={cx(
        "flex flex-col overflow-hidden rounded-xl bg-surface ring-inset",
        suggested
          ? "p-(--chat-m-selected-width) ring-(length:--chat-m-selected-width) ring-blue"
          : "p-px ring-1 ring-line",
        className,
      )}
    >
      <header className="flex items-center gap-chat-m-card-header-gap px-4 py-chat-m-card-pad-y">
        <ModelOrb model={model} />
        <div className="flex min-w-0 flex-col gap-0-5">
          <h3 className="type-chat-m-name text-ink">{modelName}</h3>
          <p className="type-ui text-ink-2">{meta}</p>
        </div>
      </header>
      {note && (
        <p
          className={cx(
            "flex items-center gap-1-5 px-4 py-2 type-ui",
            note.tone === "info"
              ? "bg-blue-soft text-blue"
              : "bg-status-success-soft text-success",
          )}
        >
          <Icon name="idea-01" className="size-icon-sm shrink-0" />
          {note.text}
        </p>
      )}
      <div className="px-4 py-chat-m-card-pad-y type-body whitespace-pre-line text-ink">
        {children}
      </div>
      <footer className="flex items-center gap-1 p-3">
        <button
          type="button"
          aria-label={labels.copy}
          title={labels.copy}
          onClick={onCopy}
          className={tap}
        >
          <Icon name="copy-01" className="size-icon-md" />
        </button>
        <button
          type="button"
          aria-label={labels.helpful}
          title={labels.helpful}
          onClick={onHelpful}
          className={tap}
        >
          <Icon name="thumbs-up" className="size-icon-md" />
        </button>
        <button
          type="button"
          aria-label={labels.notHelpful}
          title={labels.notHelpful}
          onClick={onNotHelpful}
          className={tap}
        >
          <Icon name="thumbs-down" className="size-icon-md" />
        </button>
        <span className="flex-1" />
        <button
          type="button"
          onClick={onUse}
          className={cx(
            "inline-flex h-control-lg items-center rounded-pill bg-blue-soft px-4 type-chat-m-strong text-blue",
            stateLayer,
            focusRing,
          )}
        >
          {labels.use}
        </button>
      </footer>
    </article>
  );
}
