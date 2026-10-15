// Theme preference: "system" follows prefers-color-scheme; "light" and "dark" are fixed.
// Stored per device in localStorage and applied as <html data-theme> (see styles/tokens.css).

export type ThemePreference = "system" | "light" | "dark";
export const THEME_STORAGE_KEY = "multiai-theme";

/** Runs before first paint (inline in <head>) so the page never flashes the wrong theme. */
export const THEME_SCRIPT = `(function(){try{var p=localStorage.getItem("${THEME_STORAGE_KEY}")||"system";var d=p==="dark"||(p==="system"&&matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.dataset.theme=d?"dark":"light"}catch(e){}})()`;

export function applyTheme(preference: ThemePreference) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, preference);
  } catch {}
  const dark =
    preference === "dark" ||
    (preference === "system" &&
      matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.dataset.theme = dark ? "dark" : "light";
}

export function readTheme(): ThemePreference {
  try {
    const v = localStorage.getItem(THEME_STORAGE_KEY);
    if (v === "light" || v === "dark") return v;
  } catch {}
  return "system";
}
