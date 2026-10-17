"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/atoms/Button";
import { Icon } from "@/components/atoms/Icon";
import { cx, focusRing } from "@/components/atoms/states";
import { ChoicePill } from "@/components/molecules/ChoicePill";
import { EmptyState } from "@/components/molecules/EmptyState";
import { MobileTopBar } from "@/components/organisms/MobileTopBar";
import {
  BrowseColumn,
  useBrowseToast,
} from "@/components/templates/BrowseColumn";
import { useChats } from "@/lib/chats";
import type { ChatSummary } from "@/lib/contracts/chat";
import { useRouter } from "@/lib/i18n/navigation";

import { useOverlay } from "../../../_shell/overlays";
import {
  CHAT_DELETE_AFTER_MS,
  ChatGroups,
  ChatListSkeleton,
  ChatListState,
} from "./ChatGroups";

// Figma: Prototype › Chats (desktop) and M14 · Chats (mobile, with the tab bar). Chats grouped
// Today / Yesterday / Earlier, filters (desktop), a search field that opens ⌘K search, and the tip.
// The list and its row actions (rename, pin, move to a project, delete) are ChatGroups, shared with
// the project page.

type Filter = "all" | ChatSummary["kind"];
const FILTERS: Filter[] = ["all", "best", "compare", "image"];

export function ChatsScreen() {
  const t = useTranslations("chats");
  const router = useRouter();
  const { openOverlay } = useOverlay();
  const { toast, show, hide } = useBrowseToast(CHAT_DELETE_AFTER_MS);
  const tc = useTranslations("common");
  const { chats, status, refresh } = useChats();
  // No chats at all (not just none of one kind): a first-run empty state without search or filters.
  const none = status === "ready" && chats.length === 0;
  const [filter, setFilter] = useState<Filter>("all");

  const visible = chats.filter((c) => filter === "all" || c.kind === filter);

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

        {!none && (
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
        )}

        {!none && (
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
        )}

        {status === "loading" && !chats.length ? (
          <ChatListSkeleton label={tc("loading")} />
        ) : status === "error" && !chats.length ? (
          <ChatListState>
            <EmptyState
              tone="error"
              title={t("loadError")}
              body={tc("loadErrorBody")}
              action={
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => void refresh()}
                >
                  {tc("tryAgain")}
                </Button>
              }
            />
          </ChatListState>
        ) : (
          <ChatGroups
            chats={visible}
            toast={{ show, hide }}
            empty={
              <EmptyState
                icon="bubble-chat"
                title={none ? t("first.title") : t("empty.title")}
                body={none ? t("first.body") : t("empty.body")}
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
            }
          />
        )}

        {chats.length > 0 && (
          <>
            <p className="type-ui text-ink-2 max-md:hidden">{t("tip")}</p>
            <p className="flex items-center gap-2 type-ui text-ink-2 md:hidden">
              <Icon name="information-circle" className="size-icon-sm" />
              {t("mobileTip")}
            </p>
          </>
        )}
      </div>
    </BrowseColumn>
  );
}
