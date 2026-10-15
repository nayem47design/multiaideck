"use client";

import { useFormatter, useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/atoms/Button";
import { Icon } from "@/components/atoms/Icon";
import { cx, focusRing } from "@/components/atoms/states";
import { ChatListRow } from "@/components/molecules/ChatListRow";
import { ChoicePill } from "@/components/molecules/ChoicePill";
import { EmptyState } from "@/components/molecules/EmptyState";
import { MobileTopBar } from "@/components/organisms/MobileTopBar";
import {
  BrowseColumn,
  useBrowseToast,
} from "@/components/templates/BrowseColumn";
import { api } from "@/lib/api-client";
import { IMAGE_MODEL } from "@/lib/ai/catalog";
import {
  chatHref,
  dayOf,
  invalidateChats,
  patchChats,
  timeOf,
  useChats,
} from "@/lib/chats";
import type { ChatSummary } from "@/lib/contracts/chat";
import { Link, useRouter } from "@/lib/i18n/navigation";

import { useOverlay } from "../../../_shell/overlays";
import { ChatRowContextMenu, ChatRowMoreMenu } from "./ChatRowMenu";

// Figma: Prototype › Chats (desktop) and M14 · Chats (mobile, with the tab bar). Chats grouped
// Today / Yesterday / Earlier, filters (desktop), a search field that opens ⌘K search, and the tip.
// Rename and pin are PATCH /api/chats/:id; delete is DELETE after the Undo toast has gone.

type ChatKind = ChatSummary["kind"];
type DemoChat = ChatSummary;
type Filter = "all" | ChatKind;
/** Delete for real once Undo is no longer offered. */
const DELETE_AFTER_MS = 4000;
const FILTERS: Filter[] = ["all", "best", "compare", "image"];

export function ChatsScreen() {
  const t = useTranslations("chats");
  const tn = useTranslations("nav");
  const format = useFormatter();
  const locale = useLocale();
  const router = useRouter();
  const { openOverlay } = useOverlay();
  const { toast, show, hide } = useBrowseToast(DELETE_AFTER_MS);
  const { chats, status } = useChats();
  const pinned = chats.filter((c) => c.pinned).map((c) => c.id);
  const [filter, setFilter] = useState<Filter>("all");
  const [editing, setEditing] = useState<string | null>(null);
  const renameRef = useRef<HTMLInputElement>(null);

  // The rename field opens from a menu: focus it once the menu has closed and let go of focus.
  useEffect(() => {
    if (!editing) return;
    const id = requestAnimationFrame(() => {
      renameRef.current?.focus();
      renameRef.current?.select();
    });
    return () => cancelAnimationFrame(id);
  }, [editing]);

  const n = (v: number) =>
    format.number(v, { maximumFractionDigits: v < 10 ? 1 : 0 });
  const meta = (c: DemoChat) =>
    c.kind === "image"
      ? t("meta.image", { credits: n(c.credits) })
      : c.kind === "best"
        ? t("meta.best", { credits: n(c.credits) })
        : c.prompts > 1
          ? t("meta.compareMany", {
              prompts: n(c.prompts),
              credits: n(c.credits),
            })
          : t("meta.compare", { credits: n(c.credits) });
  const mobileMeta = (c: DemoChat) =>
    c.kind === "compare"
      ? t("mobileMeta.compare", {
          count: n(c.models.length),
          credits: n(c.credits),
        })
      : t(`mobileMeta.${c.kind}`, { credits: n(c.credits) });

  const visible = chats.filter((c) => filter === "all" || c.kind === filter);
  const groups = [
    {
      key: "pinned",
      label: t("pinned"),
      chats: visible.filter((c) => pinned.includes(c.id)),
    },
    ...(["today", "yesterday", "earlier"] as const).map((day) => ({
      key: day,
      label: day === "earlier" ? t("earlier") : tn(day),
      chats: visible.filter(
        (c) => dayOf(c.updatedAt) === day && !pinned.includes(c.id),
      ),
    })),
  ].filter((g) => g.chats.length);

  const remove = (chat: DemoChat) => {
    patchChats((list) => list.filter((c) => c.id !== chat.id));
    const timer = setTimeout(() => {
      void api(`/api/chats/${chat.id}`, { method: "DELETE" }).finally(
        invalidateChats,
      );
    }, DELETE_AFTER_MS);
    show(t("deleted"), {
      action: (
        <button
          type="button"
          onClick={() => {
            clearTimeout(timer);
            invalidateChats();
            hide();
          }}
          className={cx("ml-2 rounded-xs type-ui-strong text-blue", focusRing)}
        >
          {t("undo")}
        </button>
      ),
    });
  };
  const rename = (id: string, title: string) => {
    const clean = title.trim();
    if (clean) {
      patchChats((list) =>
        list.map((c) => (c.id === id ? { ...c, title: clean } : c)),
      );
      void api(`/api/chats/${id}`, {
        method: "PATCH",
        body: { title: clean },
      }).finally(invalidateChats);
    }
    setEditing(null);
  };
  const actions = (c: DemoChat) => {
    const isPinned = pinned.includes(c.id);
    return [
      {
        icon: "pencil-edit-02" as const,
        label: t("menu.rename"),
        onSelect: () => setEditing(c.id),
      },
      {
        icon: "bookmark-02" as const,
        label: isPinned ? t("menu.unpin") : t("menu.pin"),
        onSelect: () => {
          patchChats((list) =>
            list.map((x) => (x.id === c.id ? { ...x, pinned: !isPinned } : x)),
          );
          void api(`/api/chats/${c.id}`, {
            method: "PATCH",
            body: { pinned: !isPinned },
          }).finally(invalidateChats);
        },
      },
      {
        icon: "delete-02" as const,
        label: t("menu.delete"),
        onSelect: () => remove(c),
        destructive: true,
      },
    ];
  };

  return (
    <BrowseColumn
      tabBar
      toast={toast}
      mobileTopBar={
        <MobileTopBar
          title={t("title")}
          actions={[
            {
              icon: "pencil-edit-01",
              label: t("newChat"),
              onClick: () => router.push("/"),
            },
          ]}
        />
      }
    >
      <div className="flex flex-col gap-4">
        <header className="flex h-control-lg items-center justify-between max-md:hidden">
          <h1 className="type-title text-ink">{t("title")}</h1>
          <Button
            variant="secondary"
            icon="pencil-edit-01"
            onClick={() => router.push("/")}
          >
            {t("newChat")}
          </Button>
        </header>

        <button
          type="button"
          onClick={() => openOverlay("search")}
          aria-haspopup="dialog"
          className={cx(
            "flex h-browse-search-h w-full items-center gap-search-query-gap rounded-pill bg-surface px-4 text-left ring-1 ring-line ring-inset",
            "transition-shadow duration-fast ease-out hover:ring-ink-3",
            focusRing,
          )}
        >
          <Icon
            name="search-01"
            className="size-icon-button-icon text-ink-2 max-md:size-icon-md"
          />
          <span className="flex-1 truncate type-body text-ink-3">
            {t("search")}
          </span>
          <kbd className="type-mono text-ink-2 max-md:hidden">
            {t("searchShortcut")}
          </kbd>
        </button>

        <div
          role="group"
          aria-label={t("filters.label")}
          className="flex flex-wrap gap-2 max-md:hidden"
        >
          {FILTERS.map((f) => (
            <ChoicePill
              key={f}
              selected={filter === f}
              onClick={() => setFilter(f)}
            >
              {t(`filters.${f}`)}
            </ChoicePill>
          ))}
        </div>

        {status === "loading" && !chats.length ? null : groups.length ? (
          <div className="flex flex-col gap-1 md:gap-0 md:rounded-xl md:bg-surface md:p-chats-list-pad md:ring-1 md:ring-line md:ring-inset">
            {groups.map((g) => (
              <section
                key={g.key}
                aria-label={g.label}
                className="flex flex-col gap-1 md:gap-0"
              >
                <h2 className="type-ui-strong text-ink-2 max-md:pt-1 md:flex md:h-10 md:items-center md:px-3 md:type-chats-group">
                  {g.label}
                </h2>
                {g.chats.map((c) => {
                  const rowActions = actions(c);
                  return (
                    <ChatRowContextMenu key={c.id} actions={rowActions}>
                      <ChatListRow
                        title={c.title}
                        meta={meta(c)}
                        mobileMeta={mobileMeta(c)}
                        time={timeOf(c.updatedAt, locale)}
                        models={
                          c.kind === "image" && !c.models.length
                            ? [IMAGE_MODEL]
                            : c.models
                        }
                        link={<Link href={chatHref(c)} />}
                        pinnedLabel={
                          pinned.includes(c.id) ? t("pinned") : undefined
                        }
                        more={
                          <ChatRowMoreMenu
                            label={t("more", { title: c.title })}
                            actions={rowActions}
                          />
                        }
                        editor={
                          editing === c.id ? (
                            <input
                              aria-label={t("renameLabel")}
                              defaultValue={c.title}
                              ref={renameRef}
                              onBlur={(e) =>
                                rename(c.id, e.currentTarget.value)
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter")
                                  rename(c.id, e.currentTarget.value);
                                if (e.key === "Escape") setEditing(null);
                              }}
                              className="min-w-0 flex-1 rounded-xs bg-surface px-2 type-chats-row-title text-ink ring-(length:--input-border-focus-width) ring-blue outline-none max-md:type-chats-row-title-mobile"
                            />
                          ) : undefined
                        }
                      />
                    </ChatRowContextMenu>
                  );
                })}
              </section>
            ))}
          </div>
        ) : (
          <EmptyState
            icon="bubble-chat"
            title={t("empty.title")}
            body={t("empty.body")}
            action={
              <Button
                variant="secondary"
                size="sm"
                onClick={() => router.push("/")}
              >
                {t("empty.action")}
              </Button>
            }
          />
        )}

        <p className="type-ui text-ink-2 max-md:hidden">{t("tip")}</p>
        <p className="flex items-center gap-2 type-ui text-ink-2 md:hidden">
          <Icon name="information-circle" className="size-icon-sm" />
          {t("mobileTip")}
        </p>
      </div>
    </BrowseColumn>
  );
}
