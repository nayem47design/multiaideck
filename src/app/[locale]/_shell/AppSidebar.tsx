"use client";

import { useFormatter, useTranslations } from "next-intl";

import { Sidebar } from "@/components/organisms/Sidebar";
import { Link, usePathname, useRouter } from "@/lib/i18n/navigation";
import {
  creditsToBdt,
  DEMO_BALANCE,
  DEMO_USER,
  SIDEBAR_CHATS,
} from "@/lib/mock/demo";

import { useOverlay } from "./overlays";

// The Figma Sidebar with real links, the current route selected, and the prototype's actions:
// search opens ⌘K, Top up goes to Wallet, Go Pro opens the Go Pro overlay (prototype-flows.json).

export function AppSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const t = useTranslations("nav");
  const tc = useTranslations("common");
  const format = useFormatter();
  const pathname = usePathname();
  const router = useRouter();
  const { openOverlay } = useOverlay();
  const n = (v: number) => format.number(v);

  const go = (href: string) => {
    onNavigate?.();
    router.push(href);
  };
  const link = (href: string) => <Link href={href} onClick={onNavigate} />;
  const sections = (["today", "yesterday"] as const)
    .map((day) => ({
      label: t(day),
      chats: SIDEBAR_CHATS.filter((c) => c.day === day).map((c) => ({
        id: c.id,
        title: c.title,
        meta:
          c.kind === "best"
            ? t("chatMetaBest", { credits: n(c.credits) })
            : t("chatMeta", {
                count: n(c.models.length),
                credits: n(c.credits),
              }),
        models: c.models,
        link: link(`/c/${c.id}`),
        active: pathname === `/c/${c.id}`,
      })),
    }))
    .filter((s) => s.chats.length);

  return (
    <Sidebar
      brand={tc("brand")}
      collapseLabel={t("collapse")}
      onCollapse={onNavigate}
      newChat={{
        label: t("newChat"),
        shortcut: t("newChatShortcut"),
        link: link("/"),
      }}
      search={{
        placeholder: t("search"),
        shortcut: t("searchShortcut"),
        onFocus: () => openOverlay("search"),
      }}
      nav={[
        { icon: "bubble-chat", label: t("chats"), href: "/chats" },
        { icon: "image-01", label: t("imageStudio"), href: "/images" },
        { icon: "bookmark-02", label: t("presets"), href: "/presets" },
      ].map(({ icon, label, href }) => ({
        icon: icon as "bubble-chat",
        label,
        link: link(href),
        selected: pathname.startsWith(href),
      }))}
      sections={sections}
      credits={{
        amount: tc("credits", { amount: n(DEMO_BALANCE.credits) }),
        money: tc("money", {
          amount: n(Number(creditsToBdt(DEMO_BALANCE.credits))),
        }),
        progress: DEMO_BALANCE.progress,
        progressLabel: t("creditsLeft"),
        topUp: { label: t("topUp"), onClick: () => go("/wallet") },
        goPro: {
          label: t("goPro"),
          link: (
            <button
              type="button"
              onClick={() => {
                onNavigate?.();
                openOverlay("go-pro");
              }}
            />
          ),
        },
      }}
      user={{
        name: DEMO_USER.name,
        email: DEMO_USER.email,
        initials: DEMO_USER.initials,
        menuLabel: t("accountMenu"),
        // Prototype: the user row's "more" button opens Sign out.
        onMenu: () => openOverlay("sign-out"),
      }}
    />
  );
}
