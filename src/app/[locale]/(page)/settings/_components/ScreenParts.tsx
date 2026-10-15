"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { cx } from "@/components/atoms/states";
import { MobileTopBar } from "@/components/organisms/MobileTopBar";
import { Link } from "@/lib/i18n/navigation";

// Layout pieces every settings screen shares: the M-screen top bar (below 768px; back to the
// Account tab) and the content column (mobile gutter below 768px, Figma's 24px rhythm above).

export function MobileHeader({
  title,
  aside,
}: {
  title: string;
  /** Right side of the top bar, e.g. M13's period picker. */
  aside?: ReactNode;
}) {
  const t = useTranslations("settings");
  return (
    <div className="flex items-center gap-1 pr-mobile-gutter md:hidden">
      <MobileTopBar
        className="min-w-0 flex-1"
        title={title}
        back={{ label: t("backToAccount"), link: <Link href="/settings" /> }}
      />
      {aside}
    </div>
  );
}

export function ScreenBody({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cx(
        "flex flex-col gap-3 px-mobile-gutter pt-2 pb-8 md:gap-6 md:p-0 md:pb-12",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Desktop section title (Geist Light 28/34), e.g. "Where your credits went". */
export function SectionHeading({
  children,
  aside,
}: {
  children: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="type-settings-section-title text-ink">{children}</h2>
      {aside}
    </div>
  );
}
