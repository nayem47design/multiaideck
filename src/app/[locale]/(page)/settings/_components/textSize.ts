"use client";

import { useSyncExternalStore } from "react";

import {
  applyTextSize,
  DEFAULT_TEXT_SIZE,
  readTextSize,
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
    () => DEFAULT_TEXT_SIZE,
  );
  const setSize = (next: TextSize) => {
    applyTextSize(next);
    window.dispatchEvent(new Event(EVENT));
  };
  return [size, setSize] as const;
}
