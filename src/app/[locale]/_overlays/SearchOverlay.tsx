"use client";

import { Dialog } from "radix-ui";
import { useTranslations } from "next-intl";
import { useState } from "react";

import {
  SearchChatsPanel,
  type SearchChatsResult,
} from "@/components/organisms/SearchChatsPanel";
import { IMAGE_MODEL } from "@/lib/ai/catalog";
import { chatHref, dayOf, useChats, useDebounced } from "@/lib/chats";
import type { ChatSummary } from "@/lib/contracts/chat";
import { useRouter } from "@/lib/i18n/navigation";

import type { OverlayProps } from "../_shell/overlays";

// Figma: Prototype › "Overlay · Search chats" (166:27803), opened by ⌘K anywhere and the sidebar's
// search field. Searches as you type (GET /api/chats?q=: titles and every prompt), ↑/↓ move,
// ↵ opens, Esc closes. Prototype: Result · Coffee shop names → the chat; Golpo Coffee sign →
// Picture ready.

const EXCERPT_WORDS_BEFORE = 2;

/** "Give me 3 name ideas for a small coffee shop in Dhaka" + "coffee" → "a small coffee shop in Dhaka". */
function excerpt(text: string, query: string) {
  const at = text.toLowerCase().indexOf(query.toLowerCase());
  if (at < 0) return null;
  const before = text.slice(0, at).trimEnd().split(/\s+/).filter(Boolean);
  const start = before.slice(-EXCERPT_WORDS_BEFORE).join(" ");
  return `${start} ${text.slice(at)}`.trim();
}

export function SearchOverlay({ open, onOpenChange }: OverlayProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-overlay-scrim" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed top-1/2 left-1/2 z-50 max-h-full w-search-overlay-w max-w-[calc(100%-2*var(--mobile-gutter))] -translate-1/2 overflow-y-auto outline-none"
        >
          {/* Mounted only while open, so each opening starts with an empty query. */}
          <SearchChats onDone={() => onOpenChange(false)} />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function SearchChats({ onDone }: { onDone: () => void }) {
  const t = useTranslations("search");
  const tn = useTranslations("nav");
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  const q = query.trim();
  const debounced = useDebounced(q, 150);
  const all = useChats();
  const found = useChats({ q: debounced || undefined });
  const matches = debounced ? found.chats : all.chats;

  const detail = (c: ChatSummary) => {
    const hit = q && c.kind !== "image" ? excerpt(c.snippet, q) : null;
    const day = dayOf(c.updatedAt);
    return t("detail", {
      text: hit ? t("excerpt", { text: hit }) : t(`kind.${c.kind}`),
      day: day === "earlier" ? t("earlier") : tn(day),
    });
  };
  const results: SearchChatsResult[] = matches.map((c) => ({
    id: c.id,
    title: c.title,
    detail: detail(c),
    models: c.kind === "image" && !c.models.length ? [IMAGE_MODEL] : c.models,
  }));

  const open = (id: string) => {
    const chat = matches.find((c) => c.id === id);
    if (!chat) return;
    onDone();
    router.push(chatHref(chat));
  };

  return (
    <SearchChatsPanel
      title={<Dialog.Title className="sr-only">{t("title")}</Dialog.Title>}
      query={query}
      onQueryChange={(v) => {
        setQuery(v);
        setActive(0);
      }}
      results={results}
      activeIndex={Math.min(active, Math.max(0, results.length - 1))}
      onActiveIndexChange={setActive}
      onOpen={open}
      labels={{
        search: t("placeholder"),
        count: q ? t("count", { count: results.length }) : t("recent"),
        empty: t("empty", { query: q }),
        esc: t("esc"),
        keys: t("keys"),
        enter: t("enter"),
      }}
    />
  );
}
