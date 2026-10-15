"use client";

import type { ComponentProps } from "react";
import { useSyncExternalStore } from "react";
import { useFormatter, useLocale, useTranslations } from "next-intl";

import type { AccountMenuEntry } from "@/components/organisms/AccountMenu";
import { Sidebar } from "@/components/organisms/Sidebar";
import { Link, usePathname, useRouter } from "@/lib/i18n/navigation";
import { displayName, initialsOf, useMe } from "@/lib/me";
import { dayOf, useChats } from "@/lib/chats";
import { chatDragProps, useChatDrop, useProjects } from "@/lib/projects";
import { sidebarFolds } from "@/lib/sidebar";

import { useOverlay } from "./overlays";

/** Recent chats shown in the sidebar; the rest are in Chats. */
const SIDEBAR_LIMIT = 30;

// The Figma Sidebar with real links, the current route selected, and the prototype's actions
// (prototype-flows.json, R17/R18): Search opens ⌘K, "＋" next to Projects opens New project,
// Top up goes to Wallet, Go Pro opens the Go Pro overlay, the account row opens the Account menu
// (Settings, Usage & billing, Language, Help & support, Sign out → the sign-out dialog).
// Folded sections and Credits are remembered on this device (src/lib/sidebar.ts).

export function AppSidebar({
  onNavigate,
  collapsed = false,
  onToggle,
}: {
  onNavigate?: () => void;
  /** "auto" in the shell (rail when collapsed or under 1024px); false in the drawer. */
  collapsed?: boolean | "auto";
  /** Collapse or expand (desktop), or close or open the drawer (768–1023px). */
  onToggle?: () => void;
}) {
  const t = useTranslations("nav");
  const tm = useTranslations("accountMenu");
  const tc = useTranslations("common");
  const locale = useLocale();
  const format = useFormatter();
  const pathname = usePathname();
  const router = useRouter();
  const { openOverlay } = useOverlay();
  const { user, balance, topUpLeft } = useMe();
  const { projects } = useProjects();
  const folds = useSyncExternalStore(
    sidebarFolds.subscribe,
    sidebarFolds.get,
    sidebarFolds.getServer,
  );
  const n = (v: number) => format.number(v);

  const go = (href: string) => {
    onNavigate?.();
    router.push(href);
  };
  const link = (href: string, extra?: Partial<ComponentProps<typeof Link>>) => (
    <Link href={href} onClick={onNavigate} {...extra} />
  );
  const open = (name: Parameters<typeof openOverlay>[0]) => () => {
    onNavigate?.();
    openOverlay(name);
  };

  // The user's chats (pictures live in Image studio): pinned first, then by day, newest first.
  const { chats } = useChats();
  const textChats = chats
    .filter((c) => c.kind !== "image")
    .slice(0, SIDEBAR_LIMIT);
  const groups = [
    { id: "pinned", chats: textChats.filter((c) => c.pinned) },
    ...(["today", "yesterday", "earlier"] as const).map((day) => ({
      id: day,
      chats: textChats.filter((c) => !c.pinned && dayOf(c.updatedAt) === day),
    })),
  ];
  const sections = groups
    .filter((g) => g.chats.length)
    .map((g) => ({
      id: g.id,
      label: t(g.id),
      chats: g.chats.map((c) => ({
        id: c.id,
        title: c.title,
        cost:
          c.kind === "best"
            ? t("chatCostBest", { credits: n(c.credits) })
            : t("chatCost", { credits: n(c.credits) }),
        models: c.models,
        // Drag a chat onto a project row to move it there.
        link: link(`/c/${c.id}`, chatDragProps(c.id)),
        active: pathname === `/c/${c.id}`,
      })),
    }));

  const projectPath = (id: string) => `/projects/${id}`;
  const firstProject = projects[0];

  const menu: AccountMenuEntry[] = [
    {
      id: "settings",
      icon: "settings-01",
      label: tm("settings"),
      trailing: tm("settingsShortcut"),
      link: link("/settings/profile"),
    },
    {
      id: "usage",
      icon: "chart-histogram",
      label: tm("usage"),
      link: link("/settings/usage"),
    },
    {
      id: "language",
      icon: "globe-02",
      label: tm("language"),
      trailing: tc(locale === "bn" ? "language.bangla" : "language.english"),
      submenu: true,
      link: link("/settings/profile"),
    },
    {
      id: "help",
      icon: "help-circle",
      label: tm("help"),
      link: link("/settings/help"),
    },
    {
      id: "sign-out",
      icon: "logout-03",
      label: tm("signOut"),
      tone: "danger",
      separatorBefore: true,
      onSelect: open("sign-out"),
    },
  ];

  return (
    <Sidebar
      brand={tc("brand")}
      collapseLabel={t("collapse")}
      onCollapse={onToggle ?? onNavigate}
      collapsed={collapsed}
      expandLabel={t("expand")}
      onExpand={onToggle}
      toggleShortcut={t("toggleShortcut")}
      newChat={{
        label: t("newChat"),
        shortcut: t("newChatShortcut"),
        link: link("/"),
      }}
      search={{
        label: t("search"),
        shortcut: t("searchShortcut"),
        onOpen: () => openOverlay("search"),
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
      projects={{
        label: t("projects"),
        add: { label: t("newProject"), onClick: open("new-project") },
        items: projects.map((p) => ({
          id: p.id,
          name: p.name,
          count: n(p.chatCount),
          link: <ProjectDropLink projectId={p.id} onClick={onNavigate} />,
          active: pathname === projectPath(p.id),
        })),
        // Rail: the folder opens the first project (prototype), or New project when there is none.
        rail: {
          link: firstProject ? (
            link(projectPath(firstProject.id))
          ) : (
            <button type="button" onClick={open("new-project")} />
          ),
          selected: pathname.startsWith("/projects/"),
        },
      }}
      sections={sections}
      folded={folds.sections}
      onFoldToggle={sidebarFolds.toggleSection}
      credits={{
        state: folds.credits ? "expanded" : "collapsed",
        onToggle: sidebarFolds.toggleCredits,
        expandLabel: t("showCredits"),
        collapseLabel: t("hideCredits"),
        // Until /api/me answers: no numbers rather than wrong ones.
        balance: balance
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
          link: <button type="button" onClick={open("go-pro")} />,
        },
      }}
      user={{
        name: user ? displayName(user) : "",
        email: user?.email ?? "",
        initials: user ? initialsOf(user) : "",
        menuLabel: t("accountMenu"),
        menu,
      }}
    />
  );
}

/** A project row's link that also takes dropped chats (src/lib/projects.tsx). */
function ProjectDropLink({
  projectId,
  ...props
}: { projectId: string } & Omit<ComponentProps<typeof Link>, "href">) {
  const { isOver, dropProps } = useChatDrop(projectId);
  return (
    <Link
      href={`/projects/${projectId}`}
      {...props}
      {...dropProps}
      data-over={isOver || undefined}
    />
  );
}
