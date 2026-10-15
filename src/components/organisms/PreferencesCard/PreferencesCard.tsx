import type { ReactNode } from "react";

import { cx } from "@/components/atoms/states";
import { SettingRow } from "@/components/molecules/SettingRow";

// Figma: Design system › Preferences card (103:29258): rows of setting + control (segmented
// controls and a select). Figma's component frame (301px) is narrower than its rows, so its
// layout overlaps; this lays the rows out properly. Figma's segmented options here use 16px
// padding and its select is 40px / radius 12, unlike the molecules (12px; 36px / radius 10).

export interface PreferencesCardProps {
  title: string;
  rows: { title: string; help?: string; control: ReactNode }[];
  className?: string;
}

export function PreferencesCard({
  title,
  rows,
  className,
}: PreferencesCardProps) {
  return (
    <section
      className={cx(
        "flex w-full flex-col gap-4 rounded-xl border border-line bg-surface p-6 shadow-stat-card",
        className,
      )}
    >
      <h2 className="type-step-title text-ink">{title}</h2>
      {rows.map((row) => (
        <SettingRow key={row.title} title={row.title} help={row.help}>
          {row.control}
        </SettingRow>
      ))}
    </section>
  );
}
