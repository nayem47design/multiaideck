"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { LightField } from "@/components/atoms/LightField";
import { PageTopBar } from "@/components/organisms/PageTopBar";
import {
  SettingsNav,
  type SettingsNavItem,
} from "@/components/organisms/SettingsNav";
import { SettingsShell } from "@/components/templates/SettingsShell";
import { Link, usePathname } from "@/lib/i18n/navigation";

import { DeleteAccountProvider } from "./DeleteAccount";
import { SettingsStateProvider } from "./SettingsState";

// Desktop: Template/Settings shell with the Page top bar (Back to chat · Settings · Wallet) and the
// Settings nav. Below 768px each screen draws its own M-screen top bar instead.

const NAV: {
  key: string;
  icon: SettingsNavItem["icon"];
  href: string;
  /** Other paths that select this item. */
  also?: string[];
  external?: boolean;
}[][] = [
  [
    {
      key: "profile",
      icon: "user",
      href: "/settings/profile",
      also: ["/settings"],
    },
    { key: "models", icon: "sliders-horizontal", href: "/presets" },
    {
      key: "notifications",
      icon: "notification-01",
      href: "/settings/notifications",
    },
    { key: "privacy", icon: "shield-01", href: "/settings/privacy" },
    { key: "usage", icon: "chart-histogram", href: "/settings/usage" },
  ],
  [
    { key: "wallet", icon: "wallet-01", href: "/wallet", external: true },
    {
      key: "help",
      icon: "help-circle",
      href: "/settings/help",
      external: true,
    },
  ],
];

export function SettingsFrame({ children }: { children: ReactNode }) {
  const t = useTranslations("settings");
  const pathname = usePathname();

  return (
    <SettingsStateProvider>
      <DeleteAccountProvider>
        <LightField variant="page" fixed />
        <SettingsShell
          responsive
          topBar={
            <PageTopBar
              title={t("topBar.title")}
              back={{
                label: t("topBar.back"),
                icon: "arrow-left-02",
                link: <Link href="/" />,
              }}
              action={{
                label: t("topBar.wallet"),
                icon: "wallet-01",
                link: <Link href="/wallet" />,
              }}
            />
          }
          nav={
            <SettingsNav
              label={t("nav.label")}
              className="md:max-lg:w-auto"
              groups={NAV.map((group) =>
                group.map((item) => {
                  const selected =
                    pathname === item.href || !!item.also?.includes(pathname);
                  return {
                    icon: item.icon,
                    label: t(`nav.${item.key}`),
                    external: item.external,
                    selected,
                    link: (
                      <Link
                        href={item.href}
                        aria-current={selected ? "page" : undefined}
                      />
                    ),
                  };
                }),
              )}
            />
          }
        >
          {children}
        </SettingsShell>
      </DeleteAccountProvider>
    </SettingsStateProvider>
  );
}
