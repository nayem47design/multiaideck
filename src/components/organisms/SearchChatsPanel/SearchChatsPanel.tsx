"use client";

import {
  useEffect,
  useId,
  useRef,
  type KeyboardEvent,
  type ReactNode,
  type Ref,
} from "react";

import { Icon } from "@/components/atoms/Icon";
import { cx } from "@/components/atoms/states";
import { ModelOrbStack } from "@/components/molecules/ModelOrbStack";
import type { ModelId } from "@/lib/ai/models";

// Figma: Prototype › "Overlay · Search chats" (166:27803): the query field (Esc chip), a count line,
// results (orbs, title, snippet · day, ↵) with the active one in lum/blue-soft, and the keys hint.
// A combobox: ↑/↓ move the active result, ↵ opens it. Esc and the dialog itself live in the
// overlay that renders this panel.

export interface SearchChatsResult {
  id: string;
  title: string;
  /** e.g. "“…a small coffee shop in Dhaka” · Today". */
  detail: string;
  models: ModelId[];
}

export interface SearchChatsPanelProps {
  query: string;
  onQueryChange: (query: string) => void;
  results: SearchChatsResult[];
  activeIndex: number;
  onActiveIndexChange: (index: number) => void;
  onOpen: (id: string) => void;
  labels: {
    /** Placeholder and accessible name of the field. */
    search: string;
    /** e.g. "2 chats match", "Recent chats". */
    count: string;
    /** Shown when nothing matches. */
    empty: string;
    /** "Esc". */
    esc: string;
    /** "↑ ↓ to move · ↵ to open · Esc to close". */
    keys: string;
    /** The "↵" mark on each result. */
    enter: string;
  };
  /** Rendered as the field's label (e.g. a Dialog.Title, visually hidden). */
  title?: ReactNode;
  className?: string;
  ref?: Ref<HTMLDivElement>;
}

export function SearchChatsPanel({
  query,
  onQueryChange,
  results,
  activeIndex,
  onActiveIndexChange,
  onOpen,
  labels,
  title,
  className,
  ref,
}: SearchChatsPanelProps) {
  const id = useId();
  const listRef = useRef<HTMLDivElement>(null);
  const active = results[activeIndex];

  useEffect(() => {
    listRef.current
      ?.querySelector(`[data-index="${activeIndex}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!results.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      onActiveIndexChange((activeIndex + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      onActiveIndexChange((activeIndex - 1 + results.length) % results.length);
    } else if (e.key === "Enter" && active) {
      e.preventDefault();
      onOpen(active.id);
    }
  };

  return (
    <div
      ref={ref}
      className={cx(
        "flex w-search-overlay-w max-w-full flex-col gap-1 rounded-xl bg-surface p-3 shadow-modal ring-1 ring-line ring-inset",
        className,
      )}
    >
      {title}
      <label className="flex h-search-query-h shrink-0 items-center gap-search-query-gap rounded-search-query bg-canvas px-search-query-pad text-ink-2">
        <Icon name="search-01" className="size-icon-md" />
        <input
          type="search"
          role="combobox"
          aria-expanded
          aria-controls={`${id}-list`}
          aria-activedescendant={active ? `${id}-${active.id}` : undefined}
          aria-autocomplete="list"
          aria-label={labels.search}
          placeholder={labels.search}
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={onKeyDown}
          autoFocus
          className="min-w-0 flex-1 bg-transparent type-search-query text-ink outline-none placeholder:text-ink-3 [&::-webkit-search-cancel-button]:hidden"
        />
        <kbd className="type-mono text-ink-2 max-md:hidden">{labels.esc}</kbd>
      </label>
      <p
        aria-live="polite"
        className="px-1 pt-1 pb-0-5 type-chats-group text-ink-2"
      >
        {results.length ? labels.count : labels.empty}
      </p>
      <div
        ref={listRef}
        id={`${id}-list`}
        role="listbox"
        aria-label={labels.search}
        className="flex flex-col gap-1"
      >
        {results.map((r, i) => (
          <div
            key={r.id}
            id={`${id}-${r.id}`}
            data-index={i}
            role="option"
            aria-selected={i === activeIndex}
            onMouseMove={() => i !== activeIndex && onActiveIndexChange(i)}
            onClick={() => onOpen(r.id)}
            className={cx(
              "flex h-search-result-h shrink-0 cursor-pointer items-center gap-3 rounded-md px-3",
              "transition-colors duration-fast ease-out",
              i === activeIndex && "bg-blue-soft",
            )}
          >
            <ModelOrbStack models={r.models} />
            <span className="flex min-w-0 flex-1 flex-col gap-0-5">
              <span className="truncate type-chats-row-title text-ink">
                {r.title}
              </span>
              <span className="truncate type-ui text-ink-2">{r.detail}</span>
            </span>
            <span aria-hidden className="type-mono text-ink-2">
              {labels.enter}
            </span>
          </div>
        ))}
      </div>
      <p className="px-3 py-2 type-caption text-ink-2 max-md:hidden">
        {labels.keys}
      </p>
    </div>
  );
}
