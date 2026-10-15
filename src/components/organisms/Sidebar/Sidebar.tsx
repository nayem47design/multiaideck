import type { ReactElement } from "react";
import { cloneElement } from "react";

import { AiOrb } from "@/components/atoms/AiOrb";
import { Avatar } from "@/components/atoms/Avatar";
import { Button } from "@/components/atoms/Button";
import { Icon, type IconName } from "@/components/atoms/Icon";
import { IconButton } from "@/components/atoms/IconButton";
import { ModelOrb } from "@/components/atoms/ModelOrb";
import { ProgressBar } from "@/components/atoms/ProgressBar";
import { ShortcutChip } from "@/components/atoms/ShortcutChip";
import { cx, focusRing, stateLayer } from "@/components/atoms/states";
import { NavItem } from "@/components/molecules/NavItem";
import { SearchField } from "@/components/molecules/SearchField";
import { Tooltip } from "@/components/molecules/Tooltip";
import type { ModelId } from "@/lib/ai/models";

// Figma: Design system › Sidebar (227:32985): State=Expanded (28:8525) and State=Collapsed
// (227:32794), a 66px rail whose icons keep their expanded rows and show a Tooltip (Size=Label).
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
  /** e.g. "3 models · 2.6 cr". */
  meta: string;
  models: ModelId[];
  link: LinkElement;
  active?: boolean;
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
  search: { placeholder: string; shortcut?: string; onFocus?: () => void };
  nav: {
    icon: IconName;
    label: string;
    link: LinkElement;
    selected?: boolean;
  }[];
  sections: { label: string; chats: SidebarChat[] }[];
  credits: {
    /** e.g. "10,684 credits". */
    amount: string;
    /** e.g. "≈ BDT 106.84". */
    money: string;
    /** 0–100. */
    progress: number;
    progressLabel: string;
    topUp: { label: string; onClick?: () => void };
    goPro: { label: string; link: LinkElement };
  };
  user: {
    name: string;
    email: string;
    initials: string;
    menuLabel: string;
    onMenu?: () => void;
  };
  className?: string;
}

const glassTile = "border border-glass-rim glass-strong";

const STATE = { true: "collapsed", false: "expanded", auto: "auto" } as const;

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
  sections,
  credits,
  user,
  className,
}: SidebarProps) {
  return (
    <aside
      data-sidebar-state={STATE[String(collapsed) as keyof typeof STATE]}
      className={cx(
        "flex h-full w-sidebar-width flex-col overflow-hidden rounded-xl border border-glass-rim glass px-3 py-4 shadow-sidebar",
        "transition-[width] duration-base ease-out rail:w-sidebar-rail-width",
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

        {cloneElement(
          newChat.link,
          {
            className: cx(
              "mt-3 flex h-10 shrink-0 items-center gap-2 rounded-pill px-4 text-ink type-nav-item-selected shadow-sidebar-new-chat",
              glassTile,
              focusRing,
            ),
          },
          <Icon
            key="i"
            name="pencil-edit-02"
            className="size-icon-sm text-ink-2"
          />,
          <span key="l" className="flex-1">
            {newChat.label}
          </span>,
          newChat.shortcut && (
            <ShortcutChip key="k">{newChat.shortcut}</ShortcutChip>
          ),
        )}

        <SearchField
          className="mt-1 shrink-0"
          placeholder={search.placeholder}
          aria-label={search.placeholder}
          shortcut={search.shortcut}
          onFocus={search.onFocus}
        />

        <nav className="mt-3 flex shrink-0 flex-col gap-0-5">
          {nav.map((item) => (
            <NavItem
              key={item.label}
              icon={item.icon}
              selected={item.selected}
              asChild
            >
              {cloneElement(item.link, {}, item.label)}
            </NavItem>
          ))}
        </nav>

        <div className="flex min-h-0 flex-col gap-0-5 overflow-y-auto">
          {sections.map((section) => (
            <section key={section.label} className="flex flex-col gap-0-5">
              <h2 className="px-3 pt-6 pb-1 type-sidebar-section text-ink-3">
                {section.label}
              </h2>
              {section.chats.map((chat) =>
                cloneElement(
                  chat.link,
                  {
                    key: chat.id,
                    "aria-current": chat.active ? "page" : undefined,
                    className: cx(
                      "flex flex-col rounded-sidebar-chat px-3 py-2",
                      chat.active
                        ? cx(glassTile, "shadow-sidebar-chat")
                        : "hover:bg-canvas-deep",
                      focusRing,
                    ),
                  },
                  <span
                    key="t"
                    className={cx(
                      "truncate text-ink",
                      chat.active
                        ? "type-sidebar-chat-title-active"
                        : "type-sidebar-chat-title",
                    )}
                  >
                    {chat.title}
                  </span>,
                  <span key="m" className="flex items-center gap-2">
                    <span className="flex space-x-sidebar-chat-orb-overlap">
                      {chat.models.map((m) => (
                        <ModelOrb key={m} model={m} size="sm" />
                      ))}
                    </span>
                    <span className="type-caption text-ink-3">{chat.meta}</span>
                  </span>,
                ),
              )}
            </section>
          ))}
        </div>

        <span className="flex-1" />

        <div
          className={cx(
            "flex shrink-0 flex-col gap-3 rounded-lg p-4 shadow-sidebar-credits",
            glassTile,
          )}
        >
          <div className="flex items-center gap-3">
            <span className="flex size-control-sm shrink-0 items-center justify-center rounded-pill bg-blue-soft text-blue">
              <Icon name="flash" className="size-icon-sm" />
            </span>
            <span className="flex flex-col">
              <span className="type-sidebar-credits-amount text-ink">
                {credits.amount}
              </span>
              <span className="type-caption text-ink-3">{credits.money}</span>
            </span>
          </div>
          <ProgressBar
            value={credits.progress}
            aria-label={credits.progressLabel}
          />
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={credits.topUp.onClick}
            >
              {credits.topUp.label}
            </Button>
            <span className="flex-1" />
            {cloneElement(
              credits.goPro.link,
              {
                className: cx(
                  "inline-flex items-center gap-1-5 rounded-xs text-ink type-label",
                  focusRing,
                ),
              },
              <Icon
                key="i"
                name="crown"
                className="size-select-icon text-status-warning"
              />,
              credits.goPro.label,
            )}
          </div>
        </div>

        <div className="mt-2 flex shrink-0 items-center gap-3 rounded-pill p-1">
          <Avatar initials={user.initials} name={user.name} />
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate type-nav-item-selected text-ink">
              {user.name}
            </span>
            <span className="truncate type-caption text-ink-3">
              {user.email}
            </span>
          </span>
          <IconButton
            icon="more-horizontal"
            label={user.menuLabel}
            onClick={user.onMenu}
          />
        </div>
      </div>
    </aside>
  );
}

/** Figma: Sidebar State=Collapsed. Rows line up with the expanded sidebar's. */
function Rail({
  expandLabel,
  onExpand,
  toggleShortcut,
  newChat,
  search,
  nav,
  credits,
  user,
}: Pick<
  SidebarProps,
  | "newChat"
  | "search"
  | "nav"
  | "credits"
  | "user"
  | "onExpand"
  | "toggleShortcut"
> & {
  expandLabel: string;
}) {
  const tile =
    "flex size-rail-tile shrink-0 items-center justify-center rounded-pill";
  return (
    <div className="hidden min-h-0 flex-1 flex-col items-center gap-0-5 rail:flex">
      <div className="flex size-rail-tile shrink-0 items-center justify-center">
        <Tip label={expandLabel} shortcut={toggleShortcut}>
          <IconButton
            icon="sidebar-left"
            label={expandLabel}
            onClick={onExpand}
          />
        </Tip>
      </div>

      <Tip label={newChat.label} shortcut={newChat.shortcut}>
        {cloneElement(
          newChat.link,
          {
            "aria-label": newChat.label,
            className: cx(
              tile,
              "mt-3 text-ink-2 shadow-sidebar-new-chat",
              glassTile,
              focusRing,
            ),
          } as { className: string },
          <Icon key="i" name="pencil-edit-02" className="size-icon-sm" />,
        )}
      </Tip>

      <Tip label={search.placeholder} shortcut={search.shortcut}>
        <button
          type="button"
          aria-label={search.placeholder}
          onClick={search.onFocus}
          className={cx(
            tile,
            "mt-1 text-ink-3 ring-1 ring-line ring-inset",
            stateLayer,
            focusRing,
          )}
        >
          <Icon name="search-01" className="size-icon-sm" />
        </button>
      </Tip>

      <nav className="mt-3 flex shrink-0 flex-col gap-0-5">
        {nav.map((item) => (
          <Tip key={item.label} label={item.label}>
            {cloneElement(
              item.link,
              {
                "aria-label": item.label,
                "aria-current": item.selected ? "page" : undefined,
                className: cx(
                  "flex h-rail-nav-height w-rail-tile items-center justify-center rounded-pill",
                  "transition-colors duration-fast ease-out",
                  item.selected
                    ? "border border-glass-rim bg-glass-fill-strong text-ink"
                    : "text-ink-2 hover:bg-canvas-deep hover:text-ink",
                  focusRing,
                ),
              } as { className: string },
              <Icon key="i" name={item.icon} className="size-icon-sm" />,
            )}
          </Tip>
        ))}
      </nav>

      <span className="flex-1" />

      <div className="flex shrink-0 flex-col items-center gap-3">
        <Tip label={`${credits.amount} · ${credits.money}`}>
          <button
            type="button"
            aria-label={`${credits.amount}, ${credits.money}. ${credits.topUp.label}`}
            onClick={credits.topUp.onClick}
            className={cx(
              tile,
              "rounded-lg shadow-sidebar-credits",
              glassTile,
              focusRing,
            )}
          >
            <span className="flex size-rail-credits-icon items-center justify-center rounded-pill bg-blue-soft text-blue">
              <Icon name="flash" className="size-icon-sm" />
            </span>
          </button>
        </Tip>

        <Tip label={credits.goPro.label}>
          {cloneElement(
            credits.goPro.link,
            {
              "aria-label": credits.goPro.label,
              className: cx(
                "flex h-rail-nav-height w-rail-tile items-center justify-center rounded-pill",
                stateLayer,
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

        <Tip label={user.name}>
          <button
            type="button"
            aria-label={`${user.name}. ${user.menuLabel}`}
            onClick={user.onMenu}
            className={cx(
              "flex h-rail-user-height w-rail-tile items-center justify-center rounded-pill",
              focusRing,
            )}
          >
            <Avatar initials={user.initials} name={user.name} />
          </button>
        </Tip>
      </div>
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
