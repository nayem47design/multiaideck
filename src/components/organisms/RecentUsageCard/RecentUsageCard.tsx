import { cloneElement, type ReactElement } from "react";

import { ModelOrb } from "@/components/atoms/ModelOrb";
import { cx, focusRing } from "@/components/atoms/states";
import type { ModelId } from "@/lib/ai/models";

// Figma: Prototype › M13 · Usage › "Activity": recent questions with their models and cost, and a
// note about refunds. Each item links to its chat.

export interface RecentUsageItem {
  id: string;
  title: string;
  /** e.g. "Today, 1:29 PM · 3 AIs". */
  meta: string;
  /** e.g. "26 cr". */
  amount: string;
  models: ModelId[];
  /** An empty link element, e.g. <Link href="/c/hellow" />. */
  link?: ReactElement<{ className?: string }>;
}

export interface RecentUsageCardProps {
  title: string;
  items: RecentUsageItem[];
  /** Shown when there are no items. */
  emptyLabel?: string;
  footnote?: string;
  className?: string;
}

export function RecentUsageCard({
  title,
  items,
  emptyLabel,
  footnote,
  className,
}: RecentUsageCardProps) {
  return (
    <section
      className={cx(
        "flex flex-col gap-2 rounded-lg border border-line bg-surface p-acct-card-pad",
        className,
      )}
    >
      <h2 className="type-acct-card-title text-ink">{title}</h2>
      {items.length === 0 && emptyLabel && (
        <p className="type-ui text-ink-3">{emptyLabel}</p>
      )}
      <ul className="flex flex-col">
        {items.map((item) => {
          const content = [
            <span
              key="orbs"
              aria-hidden
              className="flex shrink-0 space-x-sidebar-chat-orb-overlap"
            >
              {item.models.map((m) => (
                <ModelOrb key={m} model={m} size="sm" />
              ))}
            </span>,
            <span key="text" className="flex min-w-0 flex-1 flex-col gap-0-5">
              <span className="truncate type-acct-card-title text-ink">
                {item.title}
              </span>
              <span className="truncate type-ui text-ink-2">{item.meta}</span>
            </span>,
            <span key="amount" className="shrink-0 type-mono text-ink">
              {item.amount}
            </span>,
          ];
          const row = "flex items-center gap-2 rounded-md py-1";
          return (
            <li key={item.id}>
              {item.link ? (
                cloneElement(
                  item.link,
                  {
                    className: cx(
                      row,
                      "transition-colors duration-fast ease-out hover:bg-canvas",
                      focusRing,
                    ),
                  },
                  ...content,
                )
              ) : (
                <div className={row}>{content}</div>
              )}
            </li>
          );
        })}
      </ul>
      {footnote && <p className="type-ui text-ink-2">{footnote}</p>}
    </section>
  );
}
