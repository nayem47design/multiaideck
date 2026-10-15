import { cloneElement, Fragment, type ReactElement } from "react";

import { Divider } from "@/components/atoms/Divider";
import type { IconName } from "@/components/atoms/Icon";
import { cx } from "@/components/atoms/states";
import { NavItem } from "@/components/molecules/NavItem";

// Figma: Design system › Settings nav (28:8735). Groups are separated by a divider; external
// items (Wallet, Help) show the external-link icon.

export interface SettingsNavItem {
  icon: IconName;
  label: string;
  /** An empty link element, e.g. <Link href="/settings/profile" />. */
  link: ReactElement;
  selected?: boolean;
  external?: boolean;
}

export interface SettingsNavProps {
  groups: SettingsNavItem[][];
  label: string;
  className?: string;
}

export function SettingsNav({ groups, label, className }: SettingsNavProps) {
  return (
    <nav
      aria-label={label}
      className={cx(
        "flex w-settings-nav-width flex-col gap-0-5 rounded-xl border border-glass-rim glass p-3 shadow-settings-nav",
        className,
      )}
    >
      {groups.map((items, i) => (
        <Fragment key={i}>
          {i > 0 && <Divider />}
          {items.map((item) => (
            <NavItem
              key={item.label}
              icon={item.icon}
              selected={item.selected}
              external={item.external}
              asChild
            >
              {cloneElement(item.link, {}, item.label)}
            </NavItem>
          ))}
        </Fragment>
      ))}
    </nav>
  );
}
