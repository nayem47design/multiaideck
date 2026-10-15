"use client";

import { useTranslations } from "next-intl";

import { MobileTabBar } from "@/components/organisms/MobileTabBar";
import { cx } from "@/components/atoms/states";
import { Link, usePathname } from "@/lib/i18n/navigation";

// Below 768px: the bottom tab bar, only on the four root screens (as in the M-screens: M2, M14,
// M10, M15). Chats, checkout and sub-pages show their own top bar and no tabs.

const TABS = [
  { key: "ask", icon: "ai-magic", href: "/" },
  { key: "chats", icon: "bubble-chat", href: "/chats" },
  { key: "wallet", icon: "wallet-01", href: "/wallet" },
  { key: "account", icon: "user", href: "/settings" },
] as const;

export function isTabRoot(pathname: string) {
  return TABS.some((t) => t.href === pathname);
}

export function MobileTabs({ className }: { className?: string }) {
  const t = useTranslations("nav.tabs");
  const pathname = usePathname();
  if (!isTabRoot(pathname)) return null;

  return (
    <MobileTabBar
      label={t("label")}
      className={cx("fixed inset-x-0 bottom-0 z-30 md:hidden", className)}
      tabs={TABS.map((tab) => ({
        icon: tab.icon,
        label: t(tab.key),
        link: <Link href={tab.href} />,
        selected: pathname === tab.href,
      }))}
    />
  );
}
