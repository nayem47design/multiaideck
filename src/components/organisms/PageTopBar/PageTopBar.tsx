import { cloneElement, type ReactElement } from "react";

import { Icon, type IconName } from "@/components/atoms/Icon";
import { cx, focusRing } from "@/components/atoms/states";

// Figma: Design system › Page top bar (28:8647): back link, page title, one action.

export interface TopBarLink {
  label: string;
  icon: IconName;
  /** An empty link element, e.g. <Link href="/" /> or <a href="/" />; icon and label are added. */
  link: ReactElement<{ className?: string }>;
}

export interface PageTopBarProps {
  title: string;
  back: TopBarLink;
  action?: TopBarLink;
  className?: string;
}

const pill = cx(
  "inline-flex h-control-md items-center gap-1-5 rounded-pill px-4 text-ink type-label",
  "transition-colors duration-fast ease-out hover:bg-canvas-deep",
  focusRing,
);

function Pill({ label, icon, link }: TopBarLink) {
  return cloneElement(
    link,
    { className: pill },
    <Icon key="icon" name={icon} className="size-icon-sm text-ink-2" />,
    label,
  );
}

export function PageTopBar({
  title,
  back,
  action,
  className,
}: PageTopBarProps) {
  return (
    <header
      className={cx(
        "flex h-page-top-bar-height w-full items-center justify-between rounded-pill border border-glass-rim glass px-3 shadow-page-top-bar",
        className,
      )}
    >
      <Pill {...back} />
      <h1 className="type-page-top-bar-title text-ink">{title}</h1>
      {action ? <Pill {...action} /> : <span />}
    </header>
  );
}
