"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type DragEvent,
} from "react";

import { api, ApiClientError } from "@/lib/api-client";
import { invalidateChats } from "@/lib/chats";
import { ChatSummarySchema } from "@/lib/contracts/chat";
import {
  ProjectDetailSchema,
  ProjectListResponse,
  ProjectSchema,
  type Project,
  type ProjectDetail,
} from "@/lib/contracts/projects";

// Client stores for projects (folders of related chats), shared by every screen in the tab.
// API: src/lib/contracts/projects.ts.
//
//   const { projects, status, refresh } = useProjects();   // [{ id, name, chatCount }], oldest first
//   const { project, status } = useProject(id);            // + its chats; status "not-found" when gone
//   invalidateProjects();                                  // re-read lists and open projects
//
//   await projectActions.create(name);                     // → Project (ApiClientError 409 "conflict")
//   await projectActions.rename(id, name);
//   await projectActions.remove(id);                       // its chats move out, never deleted
//   await projectActions.moveChat(chatId, projectId|null); // null = remove from its project
//
// Drag a chat onto a project (the sidebar renders the rows; this file provides the behaviour):
//
//   <a {...chatDragProps(chat.id)}>…</a>                   // a draggable chat row
//
//   const { isOver, dropProps } = useChatDrop(project.id);  // a project row (drop target)
//   <a {...dropProps} data-over={isOver || undefined}>…</a>
//
// The drag carries the chat id as "application/x-multiai-chat". A drop moves the chat with
// projectActions.moveChat, which refreshes the projects and chat lists. Drag and drop is a
// pointer shortcut: the chat row menus offer "Move to project…" / "Remove from project" too.

type Status = "loading" | "ready" | "error";

/** What the sidebar shows per project. */
export interface ProjectItem {
  id: string;
  name: string;
  chatCount: number;
}

// ---- List

interface ListState {
  projects: Project[];
  status: Status;
}

const EMPTY_LIST: ListState = { projects: [], status: "loading" };
let listState: ListState = EMPTY_LIST;
let listLoad: Promise<void> | null = null;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

function loadList() {
  listLoad ??= api("/api/projects", { schema: ProjectListResponse })
    .then(({ projects }) => {
      listState = { projects, status: "ready" };
    })
    .catch(() => {
      listState = { projects: listState.projects, status: "error" };
    })
    .finally(() => {
      listLoad = null;
      emit();
    });
  return listLoad;
}

export function useProjects(): {
  projects: ProjectItem[];
  status: Status;
  refresh: () => Promise<void>;
} {
  const state = useSyncExternalStore(
    subscribe,
    () => listState,
    () => EMPTY_LIST,
  );
  useEffect(() => {
    if (listState.status === "loading" && !listState.projects.length)
      void loadList();
  }, []);
  return { ...state, refresh: loadList };
}

// ---- One project with its chats

type DetailStatus = Status | "not-found";
interface DetailState {
  project: ProjectDetail | null;
  status: DetailStatus;
}

const EMPTY_DETAIL: DetailState = { project: null, status: "loading" };
const details = new Map<string, DetailState>();
const detailLoads = new Map<string, Promise<void>>();

function loadDetail(id: string) {
  const running = detailLoads.get(id);
  if (running) return running;
  const p = api(`/api/projects/${encodeURIComponent(id)}`, {
    schema: ProjectDetailSchema,
  })
    .then((project) => {
      details.set(id, { project, status: "ready" });
    })
    .catch((e: unknown) => {
      details.set(id, {
        project:
          e instanceof ApiClientError && e.status === 404
            ? null
            : (details.get(id)?.project ?? null),
        status:
          e instanceof ApiClientError && e.status === 404
            ? "not-found"
            : "error",
      });
    })
    .finally(() => {
      detailLoads.delete(id);
      emit();
    });
  detailLoads.set(id, p);
  return p;
}

export function useProject(id: string) {
  const state = useSyncExternalStore(
    subscribe,
    () => details.get(id) ?? EMPTY_DETAIL,
    () => EMPTY_DETAIL,
  );
  useEffect(() => {
    void loadDetail(id);
  }, [id]);
  const refresh = useCallback(() => loadDetail(id), [id]);
  return { ...state, refresh };
}

/** Re-reads the project list and every project on screen (after a create, rename, move, delete). */
export function invalidateProjects() {
  void loadList();
  for (const id of details.keys()) void loadDetail(id);
}

/** Change every cached project's chats right away (optimistic rename, pin, delete). */
export function patchProjectChats(
  update: (chats: ProjectDetail["chats"]) => ProjectDetail["chats"],
) {
  for (const [id, s] of details)
    if (s.project) {
      const chats = update(s.project.chats);
      details.set(id, {
        ...s,
        project: { ...s.project, chats, chatCount: chats.length },
      });
    }
  emit();
}

/** Change a cached project right away (optimistic move out, rename). */
function patchDetail(id: string, update: (p: ProjectDetail) => ProjectDetail) {
  const s = details.get(id);
  if (!s?.project) return;
  details.set(id, { ...s, project: update(s.project) });
  emit();
}

// ---- Actions

export const projectActions = {
  refresh: loadList,

  async create(name: string): Promise<Project> {
    const project = await api("/api/projects", {
      method: "POST",
      body: { name },
      schema: ProjectSchema,
    });
    listState = { ...listState, projects: [...listState.projects, project] };
    emit();
    void loadList();
    return project;
  },

  async rename(id: string, name: string): Promise<Project> {
    const project = await api(`/api/projects/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: { name },
      schema: ProjectSchema,
    });
    listState = {
      ...listState,
      projects: listState.projects.map((p) => (p.id === id ? project : p)),
    };
    patchDetail(id, (d) => ({ ...d, name: project.name }));
    emit();
    return project;
  },

  async remove(id: string) {
    await api(`/api/projects/${encodeURIComponent(id)}`, { method: "DELETE" });
    listState = {
      ...listState,
      projects: listState.projects.filter((p) => p.id !== id),
    };
    details.set(id, { project: null, status: "not-found" });
    emit();
    invalidateProjects();
    // Its chats moved out of the project.
    invalidateChats();
  },

  /** Move a chat into a project, or out of its project (null). */
  async moveChat(chatId: string, projectId: string | null) {
    // Optimistic: the chat leaves any open project page it no longer belongs to.
    for (const [id, s] of details)
      if (id !== projectId && s.project?.chats.some((c) => c.id === chatId))
        patchDetail(id, (d) => ({
          ...d,
          chatCount: d.chatCount - 1,
          chats: d.chats.filter((c) => c.id !== chatId),
        }));
    try {
      return await api(`/api/chats/${encodeURIComponent(chatId)}`, {
        method: "PATCH",
        body: { projectId },
        schema: ChatSummarySchema,
      });
    } finally {
      invalidateProjects();
      invalidateChats();
    }
  },
};

// ---- Drag a chat onto a project

/** The drag data type that carries a chat id. */
export const CHAT_DRAG_TYPE = "application/x-multiai-chat";

/** Props for a draggable chat row. */
export function chatDragProps(chatId: string) {
  return {
    draggable: true,
    onDragStart: (e: DragEvent<HTMLElement>) => {
      e.dataTransfer.setData(CHAT_DRAG_TYPE, chatId);
      e.dataTransfer.effectAllowed = "move";
    },
  };
}

const carriesChat = (e: DragEvent<HTMLElement>) =>
  Array.from(e.dataTransfer.types).includes(CHAT_DRAG_TYPE);

/**
 * Makes an element a drop target for chats: dropping one moves it into `projectId`. `isOver` is
 * true while a chat is dragged over it (style the highlight with it). `onMoved` runs after the
 * move succeeds; failures are reported through `onError`.
 */
export function useChatDrop(
  projectId: string,
  {
    onMoved,
    onError,
  }: {
    onMoved?: (chatId: string) => void;
    onError?: (e: unknown) => void;
  } = {},
) {
  const [isOver, setOver] = useState(false);
  // dragenter/dragleave fire for every child; count them so the highlight doesn't flicker.
  const depth = useRef(0);

  const dropProps = {
    "aria-dropeffect": "move" as const,
    onDragEnter: (e: DragEvent<HTMLElement>) => {
      if (!carriesChat(e)) return;
      e.preventDefault();
      depth.current += 1;
      setOver(true);
    },
    onDragOver: (e: DragEvent<HTMLElement>) => {
      if (!carriesChat(e)) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
    },
    onDragLeave: (e: DragEvent<HTMLElement>) => {
      if (!carriesChat(e)) return;
      depth.current = Math.max(0, depth.current - 1);
      if (!depth.current) setOver(false);
    },
    onDrop: (e: DragEvent<HTMLElement>) => {
      const chatId = e.dataTransfer.getData(CHAT_DRAG_TYPE);
      depth.current = 0;
      setOver(false);
      if (!chatId) return;
      e.preventDefault();
      projectActions.moveChat(chatId, projectId).then(
        () => onMoved?.(chatId),
        (err: unknown) => onError?.(err),
      );
    },
  };
  return { isOver, dropProps };
}
