"use client";

import { useSyncExternalStore } from "react";

// Below 768px the M-screen layout shows (see docs/SCREENS.md). Overlays that differ between
// layouts (menu vs sheet, modal vs sheet) open the one that matches.

export function useMedia(query: string, serverValue = false) {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => serverValue,
  );
}

export const useIsMobile = () => useMedia("(max-width: 767.98px)");

/** ≥ 1280px: room for the Composer's full toolbar (880px). */
export const useIsWide = () => useMedia("(min-width: 1280px)", true);
