import type { ReactNode } from "react";

import { cx } from "@/components/atoms/states";

// Figma: Prototype › Settings · * screens: the page title (Geist Light 36/42) and one line under
// it, with optional actions on the right (Usage: period and Export CSV).

export interface SettingsHeadingProps {
  title: string;
  subtitle: string;
  actions?: ReactNode;
  className?: string;
}

export function SettingsHeading({
  title,
  subtitle,
  actions,
  className,
}: SettingsHeadingProps) {
  return (
    <header
      className={cx("flex flex-wrap items-start gap-x-6 gap-y-3", className)}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <h1 className="type-settings-title text-ink">{title}</h1>
        <p className="type-settings-subtitle text-ink-2">{subtitle}</p>
      </div>
      {actions && <div className="flex items-center gap-3 pt-2">{actions}</div>}
    </header>
  );
}
