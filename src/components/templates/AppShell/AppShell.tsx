import type { ReactNode } from "react";

import { cx } from "@/components/atoms/states";

// Figma: Design system › Template/App shell (28:9266), drawn at 0.75 scale of 1440×900.
// Sidebar on the left; the main area holds the hero or answer thread, with the Composer docked
// at the bottom, centred.

export interface AppShellProps {
  sidebar: ReactNode;
  /** Hero or answer thread. */
  children: ReactNode;
  composer?: ReactNode;
  className?: string;
}

export function AppShell({
  sidebar,
  children,
  composer,
  className,
}: AppShellProps) {
  return (
    <div
      className={cx(
        // Figma: the main area keeps the sidebar gap on its right too.
        "flex h-dvh gap-shell-gap bg-canvas py-shell-pad pr-shell-gap pl-shell-pad",
        className,
      )}
    >
      <div data-region="sidebar" className="flex shrink-0">
        {sidebar}
      </div>
      <main className="relative flex min-w-0 flex-1 flex-col">
        <div
          data-region="content"
          className="min-h-0 flex-1 overflow-y-auto pt-app-main-top"
        >
          {children}
        </div>
        {composer && (
          <div
            data-region="composer"
            className="mx-auto w-full max-w-composer-width shrink-0 pt-4 pb-3"
          >
            {composer}
          </div>
        )}
      </main>
    </div>
  );
}
