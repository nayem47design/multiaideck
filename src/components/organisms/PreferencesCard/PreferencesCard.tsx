import type { ReactNode } from "react";

import { cx } from "@/components/atoms/states";
import { SettingRow } from "@/components/molecules/SettingRow";

// Figma: Design system › Settings card › Type=Preferences (103:29258): rows of setting + control
// (segmented controls and a select). Figma's segmented options here use 16px padding and its select
// is 40px / radius 12, unlike the molecules (12px; 36px / radius 10).

export interface PreferencesRowProps {
  title: string;
  help?: string;
  control: ReactNode;
  /**
   * Wide controls (e.g. Text size, five options; Figma Row/Text size 292:55655): the control drops
   * below the title and help when the row is narrower than it needs. A container query on the
   * row's own box, so it follows the card, not the window.
   */
  wrap?: boolean;
  /** Screens: below 768px, put the control under its title (no Figma frame yet). */
  responsive?: boolean;
  className?: string;
}

/** One setting row of the card: title and help on the left, the control on the right. */
export function PreferencesRow({
  title,
  help,
  control,
  wrap = false,
  responsive = false,
  className,
}: PreferencesRowProps) {
  const row = (
    <SettingRow
      title={title}
      help={help}
      className={cx(
        wrap &&
          "flex-col items-start gap-3 @[48rem]:flex-row @[48rem]:items-center @[48rem]:gap-4",
        responsive && "max-md:flex-col max-md:items-start max-md:gap-2",
        !wrap && className,
      )}
    >
      {control}
    </SettingRow>
  );
  return wrap ? (
    <div className={cx("@container w-full", className)}>{row}</div>
  ) : (
    row
  );
}

export interface PreferencesCardProps {
  title: string;
  rows: Omit<PreferencesRowProps, "responsive" | "className">[];
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
        <PreferencesRow key={row.title} {...row} responsive={responsive} />
      ))}
    </section>
  );
}
