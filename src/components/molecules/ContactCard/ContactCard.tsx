import { cloneElement, type ReactElement, type ReactNode } from "react";

import { Icon, type IconName } from "@/components/atoms/Icon";
import { cx, focusRing } from "@/components/atoms/states";

// Figma: Prototype › Settings · Help & support › "Contact · *" (desktop) and M42 › "Contact · *"
// (below 768px: smaller, no button; the whole card is the tap target). The card is one link; the
// action pill is drawn inside it.

export interface ContactCardProps {
  icon: IconName;
  title: string;
  body: ReactNode;
  /** e.g. "Start chat". Shown from 768px. */
  actionLabel: string;
  /** An empty link element, e.g. <a href="tel:…" />. */
  link: ReactElement<{ className?: string }>;
  className?: string;
}

export function ContactCard({
  icon,
  title,
  body,
  actionLabel,
  link,
  className,
}: ContactCardProps) {
  return cloneElement(
    link,
    {
      className: cx(
        "group flex min-w-0 flex-1 flex-col items-start rounded-lg border border-line bg-surface p-acct-card-pad gap-2",
        "md:gap-help-contact-gap md:rounded-xl md:p-help-contact-pad",
        "transition-colors duration-fast ease-out max-md:hover:bg-canvas",
        focusRing,
        className,
      ),
    },
    <span
      key="tile"
      aria-hidden
      className="flex size-10 shrink-0 items-center justify-center rounded-help-contact-tile bg-blue-soft text-blue md:size-help-contact-tile"
    >
      <Icon
        name={icon}
        className="size-help-contact-tile-icon md:size-acct-row-icon"
      />
    </span>,
    <span
      key="title"
      className="type-acct-row-label text-ink md:type-help-contact-title"
    >
      {title}
    </span>,
    <span key="body" className="type-ui text-ink-2">
      {body}
    </span>,
    <span
      key="action"
      className={cx(
        "hidden h-help-contact-button-height items-center rounded-pill border border-line bg-surface px-help-contact-button-pad type-help-contact-button text-ink md:inline-flex",
        "transition-colors duration-fast ease-out group-hover:bg-canvas",
      )}
    >
      {actionLabel}
    </span>,
  );
}
