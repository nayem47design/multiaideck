import { cloneElement, type ReactElement } from "react";

import { Icon, type IconName } from "@/components/atoms/Icon";
import { cx, focusRing } from "@/components/atoms/states";

// Figma: Prototype › M-screens › "Tab bar" (M2 · Home): four tabs, the current one with a
// blue-soft indicator behind its icon and a blue label. Shown below 768px instead of the sidebar.

export interface MobileTab {
  icon: IconName;
  label: string;
  /** An empty link element, e.g. <Link href="/chats" />; icon and label are added. */
  link: ReactElement<{ className?: string; "aria-current"?: "page" }>;
  selected?: boolean;
}

export interface MobileTabBarProps {
  /** Accessible name of the navigation, e.g. "Main". */
  label: string;
  tabs: MobileTab[];
  className?: string;
}

export function MobileTabBar({ label, tabs, className }: MobileTabBarProps) {
  return (
    <nav
      aria-label={label}
      className={cx(
        "flex border-t border-line glass-strong pb-[env(safe-area-inset-bottom)]",
        className,
      )}
    >
      {tabs.map((tab) =>
        cloneElement(
          tab.link,
          {
            key: tab.label,
            "aria-current": tab.selected ? "page" : undefined,
            className: cx(
              "flex h-tab-bar-height flex-1 flex-col items-center justify-center gap-1",
              "type-tab-label",
              tab.selected ? "text-blue" : "text-ink-2",
              focusRing,
            ),
          },
          <span
            key="icon"
            className={cx(
              "flex h-tab-indicator-h w-tab-indicator-w items-center justify-center rounded-tab-indicator",
              "transition-colors duration-fast ease-out",
              tab.selected && "bg-blue-soft",
            )}
          >
            <Icon name={tab.icon} className="size-tab-icon" />
          </span>,
          tab.label,
        ),
      )}
    </nav>
  );
}
