import type { ReactNode } from "react";

import { cx } from "@/components/atoms/states";

// Figma: Design system › Setting row (28:8364): title and help on the left, a control (a Toggle in
// Figma) on the right.

export interface SettingRowProps {
  title: string;
  help?: string;
  /** The control, e.g. <Toggle aria-label={title} />. */
  children: ReactNode;
  className?: string;
}

export function SettingRow({
  title,
  help,
  children,
  className,
}: SettingRowProps) {
  return (
    <div className={cx("flex w-full items-center gap-4", className)}>
      <div className="flex min-w-0 flex-1 flex-col gap-0-5">
        <p className="type-setting-row-title text-ink">{title}</p>
        {help && <p className="type-setting-row-help text-ink-3">{help}</p>}
      </div>
      {children}
    </div>
  );
}
