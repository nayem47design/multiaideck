"use client";

import { useFormatter, useTranslations } from "next-intl";

import { Sidebar } from "@/components/organisms/Sidebar";
import { Link, usePathname, useRouter } from "@/lib/i18n/navigation";
import { displayName, initialsOf, useMe } from "@/lib/me";
import { SIDEBAR_CHATS } from "@/lib/mock/demo";

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
  const { user, balance, topUpLeft } = useMe();
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
        // Until /api/me answers: no numbers rather than wrong ones.
        amount: balance
          ? tc("credits", { amount: n(Math.floor(balance.credits)) })
          : "",
        money: balance
          ? tc("money", {
              amount: format.number(balance.bdt, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }),
            })
          : "",
        // Share of the last top-up left; full before the first top-up when there is a balance.
        progress: topUpLeft ?? (balance && balance.credits > 0 ? 100 : 0),
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
        name: user ? displayName(user) : "",
        email: user?.email ?? "",
        initials: user ? initialsOf(user) : "",
        menuLabel: t("accountMenu"),
        // Prototype: the user row's "more" button opens Sign out.
        onMenu: () => openOverlay("sign-out"),
      }}
    />
  );
}
