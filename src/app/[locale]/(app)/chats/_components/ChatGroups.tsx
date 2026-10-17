"use client";

import { useFormatter, useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { Skeleton } from "@/components/atoms/Skeleton";
import { cx, focusRing } from "@/components/atoms/states";
import { ChatListRow } from "@/components/molecules/ChatListRow";
import type { useBrowseToast } from "@/components/templates/BrowseColumn";
import { api } from "@/lib/api-client";
import { IMAGE_MODEL } from "@/lib/ai/catalog";
import {
  chatHref,
  dayOf,
  invalidateChats,
  patchChats,
  timeOf,
} from "@/lib/chats";
import type { ChatSummary } from "@/lib/contracts/chat";
import { Link } from "@/lib/i18n/navigation";
import {
  chatDragProps,
  invalidateProjects,
  patchProjectChats,
  projectActions,
  useProjects,
} from "@/lib/projects";

import { ChatRowContextMenu, ChatRowMoreMenu } from "./ChatRowMenu";
import { MoveToProjectDialog } from "./MoveToProjectDialog";

// The grouped chat list of the Chats page (Prototype › Chats › List), shared with the project page
// (Prototype › Project · …): Pinned / Today / Yesterday / Earlier, rows that open the chat, and the
// row actions: rename and pin (PATCH /api/chats/:id), move to / remove from a project, and delete
// (DELETE after the Undo toast has gone). Rows can be dragged onto a sidebar project.

/** Delete for real once Undo is no longer offered. */
const DELETE_AFTER_MS = 4000;

export { DELETE_AFTER_MS as CHAT_DELETE_AFTER_MS };

export interface ChatGroupsProps {
  /** Already filtered by the screen (kind, search). */
  chats: ChatSummary[];
  /** Shown when there is nothing to list. */
  empty: ReactNode;
  toast: Pick<ReturnType<typeof useBrowseToast>, "show" | "hide">;
}

/** Both caches (chat lists and open projects) change at once. */
function patchAll(update: (chats: ChatSummary[]) => ChatSummary[]) {
  patchChats(update);
  patchProjectChats(update);
}
function invalidateAll() {
  invalidateChats();
  invalidateProjects();
}

/** The list card (Figma: Chats › Main › List); loading, empty and error states sit in it too. */
export const CHAT_LIST_CARD =
  "flex flex-col gap-1 md:gap-0 md:rounded-xl md:bg-surface md:p-chats-list-pad md:ring-1 md:ring-line md:ring-inset";

/** A state shown inside the list card instead of rows (Empty state, Error). */
export function ChatListState({ children }: { children: ReactNode }) {
  return (
    <div className={CHAT_LIST_CARD}>
      <div className="md:[&>*]:bg-transparent">{children}</div>
    </div>
  );
}

/** Loading: placeholder rows in the list card. */
export function ChatListSkeleton({ label }: { label: string }) {
  return (
    <div role="status" aria-label={label} className={CHAT_LIST_CARD}>
      {Array.from({ length: 6 }, (_, i) => (
        <Skeleton key={i} variant="row" />
      ))}
    </div>
  );
}

export function ChatGroups({ chats, empty, toast }: ChatGroupsProps) {
  const t = useTranslations("chats");
  const tp = useTranslations("projects");
  const tn = useTranslations("nav");
  const format = useFormatter();
  const locale = useLocale();
  const { projects } = useProjects();
  const [editing, setEditing] = useState<string | null>(null);
  const [moving, setMoving] = useState<ChatSummary | null>(null);
  const renameRef = useRef<HTMLInputElement>(null);
  const { show, hide } = toast;

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
  const meta = (c: ChatSummary) =>
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
  const mobileMeta = (c: ChatSummary) =>
    c.kind === "compare"
      ? t("mobileMeta.compare", {
          count: n(c.models.length),
          credits: n(c.credits),
        })
      : t(`mobileMeta.${c.kind}`, { credits: n(c.credits) });

  const groups = [
    { key: "pinned", label: t("pinned"), chats: chats.filter((c) => c.pinned) },
    ...(["today", "yesterday", "earlier"] as const).map((day) => ({
      key: day,
      label: day === "earlier" ? t("earlier") : tn(day),
      chats: chats.filter((c) => dayOf(c.updatedAt) === day && !c.pinned),
    })),
  ].filter((g) => g.chats.length);

  const projectName = (id: string | null) =>
    projects.find((p) => p.id === id)?.name ?? "";

  const remove = (chat: ChatSummary) => {
    patchAll((list) => list.filter((c) => c.id !== chat.id));
    const timer = setTimeout(() => {
      void api(`/api/chats/${chat.id}`, { method: "DELETE" }).finally(
        invalidateAll,
      );
    }, DELETE_AFTER_MS);
    show(t("deleted"), {
      action: (
        <button
          type="button"
          onClick={() => {
            clearTimeout(timer);
            invalidateAll();
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
      patchAll((list) =>
        list.map((c) => (c.id === id ? { ...c, title: clean } : c)),
      );
      void api(`/api/chats/${id}`, {
        method: "PATCH",
        body: { title: clean },
      }).finally(invalidateAll);
    }
    setEditing(null);
  };
  const move = async (chat: ChatSummary, projectId: string | null) => {
    const name = projectName(projectId ?? chat.projectId);
    try {
      await projectActions.moveChat(chat.id, projectId);
      show(
        projectId ? tp("toast.moved", { name }) : tp("toast.removed", { name }),
      );
    } catch {
      show(tp("toast.failed"), { tone: "error" });
    }
  };

  const actions = (c: ChatSummary) => [
    {
      icon: "pencil-edit-02" as const,
      label: t("menu.rename"),
      onSelect: () => setEditing(c.id),
    },
    {
      icon: "bookmark-02" as const,
      label: c.pinned ? t("menu.unpin") : t("menu.pin"),
      onSelect: () => {
        patchAll((list) =>
          list.map((x) => (x.id === c.id ? { ...x, pinned: !c.pinned } : x)),
        );
        void api(`/api/chats/${c.id}`, {
          method: "PATCH",
          body: { pinned: !c.pinned },
        }).finally(invalidateAll);
      },
    },
    {
      icon: "folder-01" as const,
      label: c.projectId ? tp("chatMenu.moveElsewhere") : tp("chatMenu.move"),
      onSelect: () => setMoving(c),
    },
    ...(c.projectId
      ? [
          {
            icon: "cancel-01" as const,
            label: tp("chatMenu.remove"),
            onSelect: () => void move(c, null),
          },
        ]
      : []),
    {
      icon: "delete-02" as const,
      label: t("menu.delete"),
      onSelect: () => remove(c),
      destructive: true,
    },
  ];

  return (
    <>
      {groups.length ? (
        <div className={CHAT_LIST_CARD}>
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
                  <ChatRowContextMenu
                    key={c.id}
                    actions={rowActions}
                    rowProps={chatDragProps(c.id)}
                  >
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
                      pinnedLabel={c.pinned ? t("pinned") : undefined}
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
                            onBlur={(e) => rename(c.id, e.currentTarget.value)}
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
        <ChatListState>{empty}</ChatListState>
      )}
      <MoveToProjectDialog
        chat={moving}
        projects={projects}
        onOpenChange={(open) => !open && setMoving(null)}
        onMove={(projectId) => {
          const chat = moving;
          setMoving(null);
          if (chat) void move(chat, projectId);
        }}
      />
    </>
  );
}
