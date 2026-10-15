"use client";

import { useSyncExternalStore } from "react";

import { TEXT_SIZE_STORAGE_KEY, type TextSize } from "@/lib/mock/settings";

// "Easy reading" text size (M15), stored per device like the theme and mirrored on
// <html data-text-size>. The type scale for Large and Larger is not in Figma yet, so nothing reads
// the attribute so far.

const EVENT = "multiai-text-size";

function read(): TextSize {
  try {
    const v = localStorage.getItem(TEXT_SIZE_STORAGE_KEY);
    if (v === "large" || v === "larger") return v;
  } catch {}
  return "normal";
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function useTextSize() {
  const size = useSyncExternalStore(subscribe, read, () => "normal" as const);
  const setSize = (next: TextSize) => {
    try {
      localStorage.setItem(TEXT_SIZE_STORAGE_KEY, next);
    } catch {}
    document.documentElement.dataset.textSize = next;
    window.dispatchEvent(new Event(EVENT));
  };
  return [size, setSize] as const;
}
