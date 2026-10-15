"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

import { api } from "@/lib/api-client";
import { ChatListResponse, type ChatSummary } from "@/lib/contracts/chat";
import { PresetSchema, type Preset } from "@/lib/contracts/account";
import { z } from "zod";

import { DEFAULT_MODELS } from "@/lib/ai/catalog";
import type { ModelId } from "@/lib/ai/models";

// Client stores for the chat lists and presets, shared by every screen in the tab.
//
//   const { chats, status, refresh } = useChats();            // all chats, newest first
//   const { chats } = useChats({ q: "coffee" });              // search (titles and prompts)
//   invalidateChats();                                        // after sending, renaming, deleting
//
//   const { presets, inUse, models, refresh } = usePresets(); // the in-use preset's models
//
// Grouping helpers: dayOf(updatedAt) → "today" | "yesterday" | "earlier"; timeOf(updatedAt,
// locale) → "11:40" today, a weekday ("Tue") this week, else a short date.

// ---- Chats

type Status = "loading" | "ready" | "error";

interface ListState {
  chats: ChatSummary[];
  status: Status;
}

const lists = new Map<string, ListState>();
const listeners = new Set<() => void>();
const inflight = new Map<string, Promise<void>>();
const EMPTY_LIST: ListState = { chats: [], status: "loading" };

const keyOf = (q?: string, kind?: string) => `${kind ?? ""}|${q?.trim() ?? ""}`;

function emit() {
  listeners.forEach((l) => l());
}

function loadList(q?: string, kind?: string) {
  const key = keyOf(q, kind);
  const running = inflight.get(key);
  if (running) return running;
  const params = new URLSearchParams();
  if (q?.trim()) params.set("q", q.trim());
  if (kind) params.set("kind", kind);
  const p = api(`/api/chats${params.size ? `?${params}` : ""}`, {
    schema: ChatListResponse,
  })
    .then(({ chats }) => {
      lists.set(key, { chats, status: "ready" });
    })
    .catch(() => {
      lists.set(key, { chats: lists.get(key)?.chats ?? [], status: "error" });
    })
    .finally(() => {
      inflight.delete(key);
      emit();
    });
  inflight.set(key, p);
  return p;
}

/** Re-reads every chat list on screen (after a send, rename, pin or delete). */
export function invalidateChats() {
  for (const key of lists.keys()) {
    const [kind, q] = key.split("|");
    void loadList(q || undefined, kind || undefined);
  }
}

/** Change a chat in every cached list right away (optimistic rename, pin, delete). */
export function patchChats(update: (chats: ChatSummary[]) => ChatSummary[]) {
  for (const [key, s] of lists)
    lists.set(key, { ...s, chats: update(s.chats) });
  emit();
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export function useChats({
  q,
  kind,
}: { q?: string; kind?: ChatSummary["kind"] } = {}) {
  const key = keyOf(q, kind);
  const state = useSyncExternalStore(
    subscribe,
    () => lists.get(key) ?? EMPTY_LIST,
    () => EMPTY_LIST,
  );
  useEffect(() => {
    void loadList(q, kind);
  }, [q, kind]);
  const refresh = useCallback(() => loadList(q, kind), [q, kind]);
  return { ...state, refresh };
}

/** Today, yesterday, or earlier — in the user's time zone. */
export function dayOf(
  iso: string,
  now = new Date(),
): "today" | "yesterday" | "earlier" {
  const d = new Date(iso);
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  if (d >= start) return "today";
  start.setDate(start.getDate() - 1);
  return d >= start ? "yesterday" : "earlier";
}

/** "11:40" today, "Tue" within a week, else "12 Oct". */
export function timeOf(iso: string, locale: string, now = new Date()) {
  const d = new Date(iso);
  const day = dayOf(iso, now);
  if (day === "today")
    return d.toLocaleTimeString(locale, {
      hour: "numeric",
      minute: "2-digit",
      hour12: false,
    });
  if (now.getTime() - d.getTime() < 6 * 86_400_000)
    return d.toLocaleDateString(locale, { weekday: "short" });
  return d.toLocaleDateString(locale, { day: "numeric", month: "short" });
}

/** Where a chat opens: pictures open in Image studio. */
export const chatHref = (c: Pick<ChatSummary, "id" | "kind">) =>
  c.kind === "image" ? `/images?picture=${c.id}` : `/c/${c.id}`;

// ---- Presets

const PresetsResponse = z.object({ presets: z.array(PresetSchema) });

interface PresetState {
  presets: Preset[];
  status: Status;
}
let presetState: PresetState = { presets: [], status: "loading" };
let presetLoad: Promise<void> | null = null;
const presetListeners = new Set<() => void>();
const EMPTY_PRESETS: PresetState = { presets: [], status: "loading" };

function setPresets(next: PresetState) {
  presetState = next;
  presetListeners.forEach((l) => l());
}

function loadPresets() {
  presetLoad ??= api("/api/presets", { schema: PresetsResponse })
    .then(({ presets }) => setPresets({ presets, status: "ready" }))
    .catch(() => setPresets({ ...presetState, status: "error" }))
    .finally(() => {
      presetLoad = null;
    });
  return presetLoad;
}

/** Built-in presets are stored as "@<key>"; their names are messages (presets.items.<key>). */
export const builtInKey = (p: Pick<Preset, "name">) =>
  p.name.startsWith("@") ? p.name.slice(1) : null;

export const presetActions = {
  refresh: loadPresets,
  async create(name: string, models: ModelId[]) {
    const p = await api("/api/presets", {
      method: "POST",
      body: { name, models },
      schema: PresetSchema,
    });
    setPresets({ ...presetState, presets: [...presetState.presets, p] });
    return p;
  },
  async update(
    id: string,
    patch: { name?: string; models?: ModelId[]; inUse?: boolean },
  ) {
    // Optimistic: the "In use" tag moves at once.
    setPresets({
      ...presetState,
      presets: presetState.presets.map((p) =>
        p.id === id
          ? { ...p, ...patch }
          : patch.inUse
            ? { ...p, inUse: false }
            : p,
      ),
    });
    const p = await api(`/api/presets/${id}`, {
      method: "PATCH",
      body: patch,
      schema: PresetSchema,
    });
    setPresets({
      ...presetState,
      presets: presetState.presets.map((x) => (x.id === id ? p : x)),
    });
    return p;
  },
  async remove(id: string) {
    await api(`/api/presets/${id}`, { method: "DELETE" });
    await loadPresets();
  },
};

export function usePresets() {
  const s = useSyncExternalStore(
    (l) => {
      presetListeners.add(l);
      return () => presetListeners.delete(l);
    },
    () => presetState,
    () => EMPTY_PRESETS,
  );
  useEffect(() => {
    if (presetState.status === "loading" && !presetState.presets.length)
      void loadPresets();
  }, []);
  const inUse = s.presets.find((p) => p.inUse) ?? s.presets[0];
  return {
    ...s,
    inUse,
    /** The models a new prompt asks (the in-use preset's). */
    models: inUse?.models ?? DEFAULT_MODELS,
    ...presetActions,
  };
}

/** A tiny debounced value, for search-as-you-type. */
export function useDebounced<T>(value: T, ms = 200) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}
