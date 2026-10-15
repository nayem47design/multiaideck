"use client";

import { useSyncExternalStore } from "react";

import {
  readTextSize,
  TEXT_SIZE_STORAGE_KEY,
  type TextSize,
} from "@/lib/text-size";

// The text size preference as React state, shared by every control on the page (Account's Easy
// reading card and Settings › Profile). See src/lib/text-size.ts.

const EVENT = "multiai-text-size";

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function useTextSize() {
  const size = useSyncExternalStore(
    subscribe,
    readTextSize,
    () => "normal" as const,
  );
  const setSize = (next: TextSize) => {
    try {
      localStorage.setItem(TEXT_SIZE_STORAGE_KEY, next);
    } catch {}
    if (next === "normal") delete document.documentElement.dataset.textSize;
    else document.documentElement.dataset.textSize = next;
    window.dispatchEvent(new Event(EVENT));
  };
  return [size, setSize] as const;
}
