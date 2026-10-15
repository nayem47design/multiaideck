"use client";

import type { ReactElement } from "react";
import { cloneElement, useId } from "react";

import { AiOrb } from "@/components/atoms/AiOrb";
import { Avatar } from "@/components/atoms/Avatar";
import { Icon, type IconName } from "@/components/atoms/Icon";
import { IconButton } from "@/components/atoms/IconButton";
import { cx, focusRing, stateLayer } from "@/components/atoms/states";
import { ChatRow } from "@/components/molecules/ChatRow";
import { Credits, type CreditsProps } from "@/components/molecules/Credits";
import { NavItem } from "@/components/molecules/NavItem";
import { ProjectRow } from "@/components/molecules/ProjectRow";
import { SidebarSectionHeader } from "@/components/molecules/SidebarSectionHeader";
import { Tooltip } from "@/components/molecules/Tooltip";
import {
  AccountMenu,
  type AccountMenuEntry,
} from "@/components/organisms/AccountMenu";
import type { ModelId } from "@/lib/ai/models";

// Figma: Design system › Sidebar (227:32985): State=Expanded (28:8525) and State=Collapsed
// (227:32794), a 66px rail whose icons show a Tooltip (Size=Label).
//
// Expanded: Brand row · New chat + Search · nav · Projects (header "＋" and Project rows) · day
// sections of Chat rows · Credits · account row. Section headers fold their rows; Credits folds
// with its chevron; the account row (or its ⋯) opens the Account menu.
// Links take an empty link element (an <a> or Next.js <Link>); the sidebar adds the content.
//
// `collapsed`: false (expanded), true (rail), or "auto": the rail when the user collapsed it
// (<html data-sidebar="collapsed">) or below 1024px. Both layouts render; the `rail:` CSS variant
// shows one, so the first paint is already right.

type LinkElement = ReactElement<{
  className?: string;
  "aria-current"?: "page";
}>;

export interface SidebarChat {
  id: string;
  title: string;
  /** e.g. "2.6 cr" or "Best · 4 cr". */
  cost: string;
  models: ModelId[];
  link: LinkElement;
  active?: boolean;
}

export interface SidebarProject {
  id: string;
  name: string;
  /** Number of chats, formatted. */
  count: string;
  link: LinkElement;
  active?: boolean;
}

export interface SidebarSection {
  /** Stable id, used to remember the fold ("today", "yesterday"…). */
  id: string;
  label: string;
  chats: SidebarChat[];
}

export interface SidebarProps {
  brand: string;
  collapseLabel: string;
  onCollapse?: () => void;
  /** Figma State: false = Expanded, true = Collapsed, "auto" = see the note above. */
  collapsed?: boolean | "auto";
  expandLabel?: string;
  onExpand?: () => void;
  /** Shortcut shown in the collapse and expand tooltips, e.g. "⌘\\". */
  toggleShortcut?: string;
  newChat: { label: string; shortcut?: string; link: LinkElement };
  search: { label: string; shortcut?: string; onOpen?: () => void };
  nav: {
    icon: IconName;
    label: string;
    link: LinkElement;
    selected?: boolean;
  }[];
  projects: {
    label: string;
    /** The header's "＋" (New project). */
    add: { label: string; onClick?: () => void };
    items: SidebarProject[];
    /** The rail's folder icon: an empty link (or <button>). */
    rail: { link: LinkElement; selected?: boolean };
  };
  sections: SidebarSection[];
  /** Folded section ids: "projects" or a section id. */
  folded?: string[];
  onFoldToggle?: (id: string) => void;
  credits: Omit<CreditsProps, "id" | "className">;
  user: {
    name: string;
    email: string;
    initials: string;
    /** The account row's accessible name, e.g. "Account menu". */
    menuLabel: string;
    menu: AccountMenuEntry[];
  };
  className?: string;
}

const STATE = { true: "collapsed", false: "expanded", auto: "auto" } as const;

/** Hover / pressed tint for links (stateLayer's `enabled:` only matches form controls). */
const linkLayer = stateLayer.replaceAll("enabled:", "");

export function Sidebar({
  brand,
  collapseLabel,
  onCollapse,
  collapsed = false,
  expandLabel,
  onExpand,
  toggleShortcut,
  newChat,
  search,
  nav,
  projects,
  sections,
  folded = [],
  onFoldToggle,
  credits,
  user,
  className,
}: SidebarProps) {
  const id = useId();
  const isOpen = (key: string) => !folded.includes(key);

  return (
    <aside
      data-sidebar-state={STATE[String(collapsed) as keyof typeof STATE]}
      className={cx(
        "flex h-full w-sidebar-width flex-col overflow-hidden rounded-xl border border-glass-rim glass px-3 pt-sidebar-pad-top pb-3 shadow-sidebar",
        "transition-[width] duration-base ease-out rail:w-sidebar-rail-width rail:pt-rail-pad-y rail:pb-rail-pad-y",
        className,
      )}
    >
      <Rail
        expandLabel={expandLabel ?? collapseLabel}
        onExpand={onExpand}
        toggleShortcut={toggleShortcut}
        newChat={newChat}
        search={search}
        nav={nav}
        projects={projects}
        credits={credits}
        user={user}
      />
      <div className="flex min-h-0 flex-1 flex-col gap-0-5 rail:hidden">
        <div className="flex h-10 shrink-0 items-center justify-between pl-1-5">
          <span className="flex items-center gap-2">
            <AiOrb sizeClassName="size-sidebar-brand-orb" />
            <span className="type-sidebar-brand text-ink">{brand}</span>
          </span>
          <Tooltip
            size="label"
            side="bottom"
            body={collapseLabel}
            shortcut={toggleShortcut}
          >
            <IconButton
              icon="sidebar-left"
              label={collapseLabel}
              onClick={onCollapse}
            />
          </Tooltip>
        </div>

        <span aria-hidden className="h-sidebar-actions-gap shrink-0" />

        <div className="flex h-control-md shrink-0 items-center gap-sidebar-actions-gap-between">
          {cloneElement(
            newChat.link,
            {
              className: cx(
                "flex h-full min-w-0 flex-1 items-center gap-sidebar-new-chat-gap rounded-pill bg-canvas-deep px-3 text-ink",
                linkLayer,
                focusRing,
              ),
            },
            <Icon
              key="i"
              name="pencil-edit-02"
              className="size-icon-sm shrink-0 text-ink-2"
            />,
            <span key="l" className="flex-1 truncate type-sidebar-new-chat">
              {newChat.label}
            </span>,
            newChat.shortcut && (
              <kbd key="k" className="type-mono-xs text-ink-3">
                {newChat.shortcut}
              </kbd>
            ),
          )}
          <Tooltip
            size="label"
            side="bottom"
            body={search.label}
            shortcut={search.shortcut}
          >
            <button
              type="button"
              aria-label={search.label}
              aria-haspopup="dialog"
              onClick={search.onOpen}
              className={cx(
                "flex size-control-md shrink-0 items-center justify-center rounded-pill bg-canvas-deep text-ink-2",
                stateLayer,
                focusRing,
              )}
            >
              <Icon name="search-01" className="size-sidebar-search-icon" />
            </button>
          </Tooltip>
        </div>

        <span aria-hidden className="h-sidebar-nav-gap shrink-0" />

        <nav className="flex shrink-0 flex-col gap-0-5">
          {nav.map((item) => (
            <NavItem
              key={item.label}
              icon={item.icon}
              selected={item.selected}
              heightClassName="h-sidebar-nav-height"
              asChild
            >
              {cloneElement(item.link, {}, item.label)}
            </NavItem>
          ))}
        </nav>

        {/* Projects and chats scroll between the nav and Credits. */}
        <div className="-mx-1 flex min-h-0 flex-1 flex-col gap-0-5 overflow-y-auto px-1">
          <SidebarSectionHeader
            label={projects.label}
            expanded={isOpen("projects")}
            onToggle={() => onFoldToggle?.("projects")}
            controls={`${id}-projects`}
            action={{
              label: projects.add.label,
              onClick: projects.add.onClick,
            }}
          />
          <div
            id={`${id}-projects`}
            hidden={!isOpen("projects")}
            className="flex flex-col gap-0-5"
          >
            {projects.items.map((p) => (
              <ProjectRow
                key={p.id}
                name={p.name}
                count={p.count}
                state={p.active ? "active" : "default"}
                link={p.link}
              />
            ))}
          </div>

          {sections.map((section) => (
            <section
              key={section.id}
              aria-label={section.label}
              className="flex flex-col gap-0-5"
            >
              <SidebarSectionHeader
                label={section.label}
                expanded={isOpen(section.id)}
                onToggle={() => onFoldToggle?.(section.id)}
                controls={`${id}-${section.id}`}
              />
              <div
                id={`${id}-${section.id}`}
                hidden={!isOpen(section.id)}
                className="flex flex-col gap-0-5"
              >
                {section.chats.map((chat) => (
                  <ChatRow
                    key={chat.id}
                    title={chat.title}
                    cost={chat.cost}
                    models={chat.models}
                    state={chat.active ? "active" : "default"}
                    link={chat.link}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>

        <Credits id={`${id}-credits`} {...credits} />

        <span aria-hidden className="h-sidebar-user-gap shrink-0" />

        <AccountMenu label={user.menuLabel} items={user.menu}>
          <button
            type="button"
            className={cx(
              "flex shrink-0 items-center gap-3 rounded-pill p-1 text-left",
              "transition-colors duration-fast ease-out hover:bg-canvas-deep data-[state=open]:bg-canvas-deep",
              focusRing,
            )}
          >
            <Avatar initials={user.initials} name={user.name} aria-hidden />
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate type-ui-strong text-ink">
                {user.name}
              </span>
              <span className="truncate type-caption text-ink-3">
                {user.email}
              </span>
            </span>
            {/* The row's name is what it shows, then what it opens. */}
            <span className="sr-only">{user.menuLabel}</span>
            <span className="flex size-control-md shrink-0 items-center justify-center text-ink-2">
              <Icon name="more-horizontal" className="size-icon-button-icon" />
            </span>
          </button>
        </AccountMenu>
      </div>
    </aside>
  );
}

/** Figma: Sidebar State=Collapsed. */
function Rail({
  expandLabel,
  onExpand,
  toggleShortcut,
  newChat,
  search,
  nav,
  projects,
  credits,
  user,
}: Pick<
  SidebarProps,
  | "newChat"
  | "search"
  | "nav"
  | "projects"
  | "credits"
  | "user"
  | "onExpand"
  | "toggleShortcut"
> & {
  expandLabel: string;
}) {
  const tile =
    "flex size-rail-tile shrink-0 items-center justify-center rounded-pill";
  const navTile = (selected?: boolean) =>
    cx(
      "flex h-rail-nav-height w-rail-tile shrink-0 items-center justify-center rounded-pill",
      "transition-colors duration-fast ease-out",
      selected
        ? "border border-glass-rim bg-glass-fill-strong text-ink"
        : "text-ink-2 hover:bg-canvas-deep hover:text-ink",
      focusRing,
    );
  const gap = (h: string) => <span aria-hidden className={cx(h, "shrink-0")} />;

  return (
    <div className="hidden min-h-0 flex-1 flex-col items-center gap-0-5 rail:flex">
      <div className="flex size-10 shrink-0 items-center justify-center">
        <Tip label={expandLabel} shortcut={toggleShortcut}>
          <IconButton
            icon="sidebar-left"
            label={expandLabel}
            onClick={onExpand}
          />
        </Tip>
      </div>

      {gap("h-rail-group-gap")}

      <Tip label={newChat.label} shortcut={newChat.shortcut}>
        {cloneElement(
          newChat.link,
          {
            "aria-label": newChat.label,
            className: cx(
              tile,
              "bg-canvas-deep text-ink-2",
              linkLayer,
              focusRing,
            ),
          } as { className: string },
          <Icon key="i" name="pencil-edit-02" className="size-icon-sm" />,
        )}
      </Tip>

      {gap("h-rail-search-gap")}

      <Tip label={search.label} shortcut={search.shortcut}>
        <button
          type="button"
          aria-label={search.label}
          aria-haspopup="dialog"
          onClick={search.onOpen}
          className={cx(
            tile,
            "bg-canvas-deep text-ink-3",
            stateLayer,
            focusRing,
          )}
        >
          <Icon name="search-01" className="size-icon-sm" />
        </button>
      </Tip>

      {gap("h-rail-group-gap")}

      <nav className="flex shrink-0 flex-col gap-0-5">
        {nav.map((item) => (
          <Tip key={item.label} label={item.label}>
            {cloneElement(
              item.link,
              {
                "aria-label": item.label,
                "aria-current": item.selected ? "page" : undefined,
                className: navTile(item.selected),
              } as { className: string },
              <Icon key="i" name={item.icon} className="size-icon-sm" />,
            )}
          </Tip>
        ))}
        <Tip label={projects.label}>
          {cloneElement(
            projects.rail.link,
            {
              "aria-label": projects.label,
              "aria-current": projects.rail.selected ? "page" : undefined,
              className: navTile(projects.rail.selected),
            } as { className: string },
            <Icon key="i" name="folder-01" className="size-icon-sm" />,
          )}
        </Tip>
      </nav>

      <span className="flex-1" />

      <Tip label={`${credits.balance} · ${credits.money}`}>
        <button
          type="button"
          aria-label={`${credits.balance}, ${credits.money}. ${credits.topUp.label}`}
          onClick={credits.topUp.onClick}
          className={cx(
            "flex size-rail-tile shrink-0 items-center justify-center rounded-rail-credits bg-canvas-deep",
            focusRing,
          )}
        >
          <span className="flex size-rail-credits-icon items-center justify-center rounded-pill bg-blue-soft text-blue">
            <Icon name="flash" className="size-icon-sm" />
          </span>
        </button>
      </Tip>

      {gap("h-rail-footer-gap")}

      <Tip label={credits.goPro.label}>
        {cloneElement(
          credits.goPro.link,
          {
            "aria-label": credits.goPro.label,
            className: cx(
              "flex h-rail-nav-height w-rail-tile shrink-0 items-center justify-center rounded-pill",
              linkLayer,
              focusRing,
            ),
          } as { className: string },
          <Icon
            key="i"
            name="crown"
            className="size-rail-crown text-status-warning"
          />,
        )}
      </Tip>

      {gap("h-rail-footer-gap")}

      <AccountMenu
        label={user.menuLabel}
        items={user.menu}
        side="right"
        align="end"
        alignOffset={0}
      >
        <button
          type="button"
          aria-label={`${user.name}. ${user.menuLabel}`}
          className={cx(
            "flex h-rail-user-height w-rail-tile shrink-0 items-center justify-center rounded-pill",
            focusRing,
          )}
        >
          <Avatar initials={user.initials} name={user.name} />
        </button>
      </AccountMenu>
    </div>
  );
}

function Tip({
  label,
  shortcut,
  children,
}: {
  label: string;
  shortcut?: string;
  children: React.ReactElement;
}) {
  return (
    <Tooltip size="label" side="right" body={label} shortcut={shortcut}>
      {children}
    </Tooltip>
  );
}
