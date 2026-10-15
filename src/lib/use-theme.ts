"use client";

import { useEffect, useSyncExternalStore } from "react";

import { applyTheme, readTheme, type ThemePreference } from "./theme";

// The theme preference as React state, shared by every control on the page (client only;
// theme.ts stays importable from the server layout for its no-flash script).

const themeListeners = new Set<() => void>();

/** Set and apply the theme, and tell every useThemePreference() on the page. */
export function setTheme(preference: ThemePreference) {
  applyTheme(preference);
  themeListeners.forEach((l) => l());
}

/** [preference, setTheme]. "system" (the server's value) until the browser's choice is read. */
export function useThemePreference(): [ThemePreference, typeof setTheme] {
  const preference = useSyncExternalStore(
    (onChange) => {
      themeListeners.add(onChange);
      return () => themeListeners.delete(onChange);
    },
    readTheme,
    () => "system" as const,
  );
  // System follows the operating system's light/dark switch while the page is open.
  useEffect(() => {
    if (preference !== "system") return;
    const mql = matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme("system");
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [preference]);
  return [preference, setTheme];
}

/**
 * The theme on screen right now ("light" | "dark"): <html data-theme>, which follows the
 * preference (and the device, for System). "light" on the server.
 */
export function useResolvedTheme(): "light" | "dark" {
  return useSyncExternalStore(
    (onChange) => {
      const observer = new MutationObserver(onChange);
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["data-theme"],
      });
      return () => observer.disconnect();
    },
    () =>
      document.documentElement.dataset.theme === "dark" ? "dark" : "light",
    () => "light" as const,
  );
}
