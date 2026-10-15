import type { ReactNode } from "react";

import { cx } from "@/components/atoms/states";

// Figma: Design system › Template/Settings shell (28:9322), drawn at 0.75 scale of 1440×900.
// Page top bar, then a centred page column: Settings nav and the page's setting cards.

export interface SettingsShellProps {
  topBar: ReactNode;
  nav: ReactNode;
  /** Page title and setting cards. */
  children: ReactNode;
  /**
   * Screens: below 768px hide the top bar and nav and drop the padding (M-screens draw their own
   * top bar), and leave the background to the page's light field.
   */
  responsive?: boolean;
  className?: string;
}

export function SettingsShell({
  topBar,
  nav,
  children,
  responsive = false,
  className,
}: SettingsShellProps) {
  const r = responsive;
  return (
    <div
      className={cx(
        "flex min-h-dvh flex-col p-shell-pad",
        r ? "max-md:p-0" : "bg-canvas",
        className,
      )}
    >
      <div data-region="top-bar" className={cx(r && "max-md:hidden")}>
        {topBar}
      </div>
      <div
        className={cx(
          "mx-auto mt-page-top flex w-full max-w-page-width items-start gap-settings-gap",
          r && "max-md:mt-0 md:max-lg:gap-6",
        )}
      >
        <div
          data-region="nav"
          className={cx("sticky top-shell-pad shrink-0", r && "max-md:hidden")}
        >
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
