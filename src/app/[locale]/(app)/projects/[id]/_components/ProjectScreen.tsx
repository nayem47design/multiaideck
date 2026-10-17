"use client";

import { useFormatter, useTranslations } from "next-intl";
import { notFound } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/atoms/Button";
import { Icon } from "@/components/atoms/Icon";
import { cx } from "@/components/atoms/states";
import { ChoicePill } from "@/components/molecules/ChoicePill";
import { EmptyState } from "@/components/molecules/EmptyState";
import { MobileTopBar } from "@/components/organisms/MobileTopBar";
import { NewProjectDialog } from "@/components/organisms/NewProjectDialog";
import {
  BrowseColumn,
  useBrowseToast,
} from "@/components/templates/BrowseColumn";
import { ApiClientError } from "@/lib/api-client";
import type { ChatSummary } from "@/lib/contracts/chat";
import { PROJECT_NAME_MAX } from "@/lib/contracts/projects";
import { Link, useRouter } from "@/lib/i18n/navigation";
import { projectActions, useProject, useProjects } from "@/lib/projects";

import {
  CHAT_DELETE_AFTER_MS,
  ChatGroups,
  ChatListSkeleton,
  ChatListState,
} from "../../../chats/_components/ChatGroups";
import { ChatRowMoreMenu } from "../../../chats/_components/ChatRowMenu";
import { DeleteProjectDialog } from "./DeleteProjectDialog";

// Figma: Prototype › Project · MultiAI launch (245:36126; Coffee brand 245:38074, Thesis research
// 245:38534; Dark 245:36659 · 245:38304 · 245:38764). The Chats page's layout for one project:
// folder icon + name, "N chats · …", New chat, a search field that filters this project's chats
// (⌘K still opens the global search), the filters, the grouped list (shared ChatGroups) and the tip.
// Empty, loading and error: 04 · Desktop screens, row 10 (Project · Empty / Loading / Error).
// Not in Figma: the project menu (rename, delete) and the no-results state.
// Below 768px: a top bar with back to /chats, no tab bar (as other sub-screens).

type Filter = "all" | ChatSummary["kind"];
const FILTERS: Filter[] = ["all", "best", "compare", "image"];

export function ProjectScreen({ id }: { id: string }) {
  const t = useTranslations("projects");
  const tc = useTranslations("chats");
  const router = useRouter();
  const format = useFormatter();
  const tcommon = useTranslations("common");
  const { project, status, refresh } = useProject(id);
  const { projects } = useProjects();
  const { toast, show, hide } = useBrowseToast(CHAT_DELETE_AFTER_MS);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState("");
  const [renameError, setRenameError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (status === "not-found") notFound();
  if (!project) {
    // Loading or failed: the name from the sidebar's project list, then placeholder rows or Error.
    const known = projects.find((p) => p.id === id)?.name ?? "";
    return (
      <BrowseColumn
        mobileTopBar={
          <MobileTopBar
            title={known}
            back={{ label: t("back"), link: <Link href="/chats" /> }}
          />
        }
      >
        <div className="flex flex-col gap-4">
          <header className="flex h-control-lg items-center gap-project-title-gap max-md:hidden">
            <Icon
              name="folder-01"
              className="size-project-title-icon shrink-0 text-blue"
            />
            <h1 className="truncate type-title text-ink">{known}</h1>
          </header>
          {status === "error" ? (
            <ChatListState>
              <EmptyState
                tone="error"
                title={t("loadError")}
                body={tcommon("loadErrorBody")}
                action={
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => void refresh()}
                  >
                    {tcommon("tryAgain")}
                  </Button>
                }
              />
            </ChatListState>
          ) : (
            <ChatListSkeleton label={tcommon("loading")} />
          )}
        </div>
      </BrowseColumn>
    );
  }
  const none = project.chats.length === 0;

  const newChat = () => router.push(`/?project=${encodeURIComponent(id)}`);
  const q = query.trim().toLowerCase();
  const visible = project.chats.filter(
    (c) =>
      (filter === "all" || c.kind === filter) &&
      (!q ||
        c.title.toLowerCase().includes(q) ||
        c.snippet.toLowerCase().includes(q)),
  );

  const rename = async () => {
    const clean = name.trim();
    setBusy(true);
    try {
      await projectActions.rename(id, clean);
      setRenaming(false);
      show(t("toast.renamed"));
    } catch (e) {
      setRenameError(
        e instanceof ApiClientError && e.code === "conflict"
          ? t("errors.taken", { name: clean })
          : t("errors.failed"),
      );
    } finally {
      setBusy(false);
    }
  };
  const remove = async () => {
    setBusy(true);
    try {
      await projectActions.remove(id);
      router.push("/chats");
    } catch {
      setBusy(false);
      setDeleting(false);
      show(t("toast.failed"), { tone: "error" });
    }
  };

  const projectMenu = (
    <ChatRowMoreMenu
      label={t("options")}
      actions={[
        {
          icon: "pencil-edit-02",
          label: t("menu.rename"),
          onSelect: () => {
            setName(project.name);
            setRenameError(undefined);
            setRenaming(true);
          },
        },
        {
          icon: "delete-02",
          label: t("menu.delete"),
          onSelect: () => setDeleting(true),
          destructive: true,
        },
      ]}
    />
  );

  return (
    <BrowseColumn
      toast={toast}
      mobileTopBar={
        <MobileTopBar
          title={project.name}
          back={{ label: t("back"), link: <Link href="/chats" /> }}
          actions={[
            { icon: "pencil-edit-01", label: t("newChat"), onClick: newChat },
          ]}
        />
      }
    >
      <div className="flex flex-col gap-4">
        <header className="flex h-control-lg items-center justify-between max-md:hidden">
          <div className="flex min-w-0 items-center gap-project-title-gap">
            <Icon
              name="folder-01"
              className="size-project-title-icon shrink-0 text-blue"
            />
            <h1 className="truncate type-title text-ink">{project.name}</h1>
            {projectMenu}
          </div>
          <Button variant="secondary" icon="pencil-edit-01" onClick={newChat}>
            {t("newChat")}
          </Button>
        </header>

        <div className="flex items-center justify-between gap-2">
          <p className="type-body-small text-ink-3">
            {t("meta", {
              count: project.chatCount,
              n: format.number(project.chatCount),
            })}
          </p>
          <span className="md:hidden">{projectMenu}</span>
        </div>

        {!none && (
          <label
            className={cx(
              "flex h-browse-search-h w-full items-center gap-search-query-gap rounded-pill bg-surface px-4 ring-1 ring-line ring-inset",
              "transition-shadow duration-fast ease-out focus-within:ring-(length:--input-border-focus-width) focus-within:ring-blue hover:ring-ink-3",
            )}
          >
            <Icon
              name="search-01"
              className="size-icon-button-icon shrink-0 text-ink-2 max-md:size-icon-md"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.currentTarget.value)}
              placeholder={t("search", { name: project.name })}
              aria-label={t("search", { name: project.name })}
              className="min-w-0 flex-1 bg-transparent type-body text-ink outline-none placeholder:text-ink-3 [&::-webkit-search-cancel-button]:hidden"
            />
            <kbd className="type-mono text-ink-2 max-md:hidden">
              {t("searchShortcut")}
            </kbd>
          </label>
        )}

        {!none && (
          <div
            role="group"
            aria-label={tc("filters.label")}
            className="flex flex-wrap gap-2 max-md:hidden"
          >
            {FILTERS.map((f) => (
              <ChoicePill
                key={f}
                selected={filter === f}
                onClick={() => setFilter(f)}
              >
                {tc(`filters.${f}`)}
              </ChoicePill>
            ))}
          </div>
        )}

        <ChatGroups
          chats={visible}
          toast={{ show, hide }}
          empty={
            project.chats.length ? (
              <EmptyState
                icon="search-01"
                title={t("noResults.title")}
                body={t("noResults.body")}
              />
            ) : (
              <EmptyState
                icon="folder-01"
                title={t("empty.title")}
                body={t("empty.body")}
                action={
                  <Button variant="secondary" size="sm" onClick={newChat}>
                    {t("empty.action")}
                  </Button>
                }
              />
            )
          }
        />

        {!none && (
          <>
            <p className="type-ui text-ink-2 max-md:hidden">{t("tip")}</p>
            <p className="flex items-center gap-2 type-ui text-ink-2 md:hidden">
              <Icon name="information-circle" className="size-icon-sm" />
              {t("mobileTip")}
            </p>
          </>
        )}
      </div>

      <NewProjectDialog
        open={renaming}
        onOpenChange={setRenaming}
        title={t("renameDialog.title")}
        body={t("renameDialog.body")}
        label={t("dialog.label")}
        placeholder={t("dialog.placeholder")}
        cancelLabel={t("dialog.cancel")}
        submitLabel={t("renameDialog.save")}
        submitIcon="pencil-edit-02"
        value={name}
        onValueChange={(v) => {
          setName(v);
          setRenameError(undefined);
        }}
        submitDisabled={!name.trim() || name.trim() === project.name}
        maxLength={PROJECT_NAME_MAX}
        error={renameError}
        busy={busy}
        onSubmit={rename}
      />
      <DeleteProjectDialog
        open={deleting}
        onOpenChange={setDeleting}
        name={project.name}
        chatCount={project.chatCount}
        chatCountLabel={format.number(project.chatCount)}
        busy={busy}
        onDelete={remove}
      />
    </BrowseColumn>
  );
}
