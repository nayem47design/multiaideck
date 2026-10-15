import { cloneElement, type ReactElement } from "react";

import { Icon, type IconName } from "@/components/atoms/Icon";
import { cx, focusRing } from "@/components/atoms/states";

// Figma: Prototype › Wallet › "Usage link": a one-line note with a link at the end
// ("Where your credits went … See usage →"). Not a Design system component yet.

export interface CalloutLinkProps {
  icon: IconName;
  text: string;
  /** An empty link element, e.g. <Link href="/settings/usage" />; the label is added. */
  link: ReactElement<{ className?: string }>;
  linkLabel: string;
  className?: string;
}

export function CalloutLink({
  icon,
  text,
  link,
  linkLabel,
  className,
}: CalloutLinkProps) {
  return (
    <div
      className={cx(
        "flex flex-wrap items-center gap-3 rounded-usage-link border border-line bg-surface px-5 py-4",
        className,
      )}
    >
      <Icon name={icon} className="size-icon-md shrink-0 text-ink-2" />
      <p className="min-w-0 flex-1 type-ui text-ink">{text}</p>
      {cloneElement(
        link,
        {
          className: cx(
            "shrink-0 rounded-xs type-ui-strong text-blue hover:underline",
            focusRing,
          ),
        },
        linkLabel,
      )}
    </div>
  );
}
