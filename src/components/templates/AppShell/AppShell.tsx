import type { ReactNode } from "react";

import { cx } from "@/components/atoms/states";

// Figma: Design system › Template/App shell (28:9266), drawn at 0.75 scale of 1440×900.
// Sidebar on the left; the main area holds the hero or answer thread, with the Composer docked
// at the bottom, centred. From 768px the sidebar region shows (the collapsed rail up to 1024px);
// below 768px the app uses the mobile tab bar and the main area runs edge to edge.

export interface AppShellProps {
  sidebar: ReactNode;
  /** Hero or answer thread. Without `composer`, rendered as is (wrap it in <AppMain>). */
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
        "relative isolate flex h-dvh bg-canvas",
        // Figma: the main area keeps the sidebar gap on its right too.
        "md:gap-shell-gap md:py-shell-pad md:pr-shell-gap md:pl-shell-pad",
        className,
      )}
    >
      <div data-region="sidebar" className="hidden shrink-0 md:flex">
        {sidebar}
      </div>
      <main className="relative flex min-w-0 flex-1 flex-col">
        {composer === undefined ? (
          children
        ) : (
          <AppMain composer={composer}>{children}</AppMain>
        )}
      </main>
    </div>
  );
}

export interface AppMainProps {
  /** Hero or answer thread; scrolls under the docked composer. */
  children: ReactNode;
  composer?: ReactNode;
  /** Small print under the composer. */
  footnote?: ReactNode;
  /** Content top inset; Figma's app shell puts the thread below the top bar. */
  className?: string;
}

/** The main column of the app shell: scrolling content with the composer docked below it. */
export function AppMain({
  children,
  composer,
  footnote,
  className,
}: AppMainProps) {
  return (
    <>
      <div
        data-region="content"
        className={cx(
          "min-h-0 flex-1 overflow-y-auto pt-app-main-top",
          className,
        )}
      >
        {children}
      </div>
      {composer && (
        <div
          data-region="composer"
          className="mx-auto w-full max-w-composer-width shrink-0 px-3 pt-4 pb-3 lg:px-0"
        >
          {composer}
          {footnote && (
            <p className="mt-2 text-center type-caption text-ink-3">
              {footnote}
            </p>
          )}
        </div>
      )}
    </>
  );
}
