import { cloneElement, type ReactElement, type ReactNode } from "react";

import { Icon, type IconName } from "@/components/atoms/Icon";
import { cx, focusRing, stateLayer } from "@/components/atoms/states";

// Figma: Prototype › M-screens › "Top bar" (M5 · Best answer, M14 · Chats): 56px tall, 48px tap
// targets with 24px icons, title in Luminous/Heading. Root screens have no back button and inset
// the title instead.

export interface MobileTopBarAction {
  icon: IconName;
  label: string;
  onClick?: () => void;
}

export interface MobileTopBarProps {
  title: ReactNode;
  /** Back link: an empty link element, e.g. <Link href="/" />. Omit on root screens. */
  back?: { label: string; link: ReactElement<{ className?: string }> };
  actions?: MobileTopBarAction[];
  className?: string;
}

const tap = cx(
  "flex size-mobile-tap shrink-0 items-center justify-center rounded-pill text-ink",
  stateLayer,
  focusRing,
);

export function MobileTopBar({
  title,
  back,
  actions = [],
  className,
}: MobileTopBarProps) {
  return (
    <header
      className={cx(
        "flex h-mobile-top-bar-height items-center gap-1 px-mobile-top-bar-pad",
        className,
      )}
    >
      {back ? (
        cloneElement(
          back.link,
          { className: tap, "aria-label": back.label } as {
            className: string;
          },
          <Icon
            key="icon"
            name="arrow-left-01"
            className="size-mobile-tap-icon"
          />,
        )
      ) : (
        <span className="w-3 shrink-0" />
      )}
      <h1 className="min-w-0 flex-1 truncate type-heading text-ink">{title}</h1>
      {actions.map((a) => (
        <button
          key={a.label}
          type="button"
          aria-label={a.label}
          title={a.label}
          onClick={a.onClick}
          className={tap}
        >
          <Icon name={a.icon} className="size-mobile-tap-icon" />
        </button>
      ))}
    </header>
  );
}
