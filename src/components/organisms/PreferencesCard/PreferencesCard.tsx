import type { ReactNode } from "react";

import { cx } from "@/components/atoms/states";
import { SettingRow } from "@/components/molecules/SettingRow";

// Figma: Design system › Preferences card (103:29258): rows of setting + control (segmented
// controls and a select). Figma's segmented options here use 16px
// padding and its select is 40px / radius 12, unlike the molecules (12px; 36px / radius 10).

export interface PreferencesCardProps {
  title: string;
  rows: { title: string; help?: string; control: ReactNode }[];
  /** Screens: below 768px, put each control under its title (no Figma frame yet). */
  responsive?: boolean;
  className?: string;
}

export function PreferencesCard({
  title,
  rows,
  responsive = false,
  className,
}: PreferencesCardProps) {
  return (
    <section
      className={cx(
        "flex w-full flex-col gap-4 rounded-xl border border-line bg-surface p-6 shadow-stat-card",
        responsive && "max-md:gap-5 max-md:p-4",
        className,
      )}
    >
      <h2 className="type-step-title text-ink">{title}</h2>
      {rows.map((row) => (
        <SettingRow
          key={row.title}
          title={row.title}
          help={row.help}
          className={cx(
            responsive && "max-md:flex-col max-md:items-start max-md:gap-2",
          )}
        >
          {row.control}
        </SettingRow>
      ))}
    </section>
  );
}
