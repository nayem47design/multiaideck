import type { ReactNode } from "react";

import { cx } from "@/components/atoms/states";

// Figma: Design system › Template/Settings shell (28:9322), drawn at 0.75 scale of 1440×900.
// Page top bar, then a centred page column: Settings nav and the page's setting cards.

export interface SettingsShellProps {
  topBar: ReactNode;
  nav: ReactNode;
  /** Page title and setting cards. */
  children: ReactNode;
  className?: string;
}

export function SettingsShell({
  topBar,
  nav,
  children,
  className,
}: SettingsShellProps) {
  return (
    <div
      className={cx("flex min-h-dvh flex-col bg-canvas p-shell-pad", className)}
    >
      <div data-region="top-bar">{topBar}</div>
      <div className="mx-auto mt-page-top flex w-full max-w-page-width items-start gap-settings-gap">
        <div data-region="nav" className="sticky top-shell-pad shrink-0">
          {nav}
        </div>
        <div
          data-region="content"
          className="flex min-w-0 flex-1 flex-col gap-4"
        >
          {children}
        </div>
      </div>
    </div>
  );
}
