import { cloneElement, type ReactElement } from "react";

import { Icon } from "@/components/atoms/Icon";
import { cx, focusRing } from "@/components/atoms/states";

// Figma: Prototype › M15 · Account & settings › "Profile": avatar initials, name, a detail line
// (the masked phone number) and a chevron. The whole card is one link.

export interface AccountProfileRowProps {
  initials: string;
  name: string;
  detail: string;
  /** An empty link element, e.g. <Link href="/settings/privacy" />. */
  link: ReactElement<{ className?: string }>;
  className?: string;
}

export function AccountProfileRow({
  initials,
  name,
  detail,
  link,
  className,
}: AccountProfileRowProps) {
  return cloneElement(
    link,
    {
      className: cx(
        "flex items-center gap-3 rounded-lg border border-line bg-surface p-acct-profile-pad text-ink",
        "transition-colors duration-fast ease-out hover:bg-canvas",
        focusRing,
        className,
      ),
    },
    <span
      key="avatar"
      aria-hidden
      className="flex size-acct-profile-avatar shrink-0 items-center justify-center rounded-pill bg-blue-soft type-acct-row-label text-blue"
    >
      {initials}
    </span>,
    <span key="text" className="flex min-w-0 flex-1 flex-col gap-0-5">
      <span className="truncate type-acct-row-label text-ink">{name}</span>
      <span className="truncate type-ui text-ink-2">{detail}</span>
    </span>,
    <Icon
      key="chevron"
      name="arrow-right-01"
      className="size-acct-profile-chevron shrink-0 text-ink"
    />,
  );
}
