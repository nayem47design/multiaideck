// Text size preference ("Easy reading", M15; Settings › Profile on desktop): Extra small, Small,
// Normal (default), Large, Larger. Stored per device in localStorage and applied as
// <html data-text-size>, which sets the root scale (styles/effects.css): --type-scale, which every
// text style multiplies Figma's sizes by (styles/typography.css, components.css), and the root
// font-size, so rem-based and browser-default text follow too. Server-safe: the layout imports
// TEXT_SIZE_SCRIPT.

export type TextSize = "xsmall" | "small" | "normal" | "large" | "larger";
/** Smallest first, as in Figma. */
export const TEXT_SIZES: readonly TextSize[] = [
  "xsmall",
  "small",
  "normal",
  "large",
  "larger",
];
export const DEFAULT_TEXT_SIZE: TextSize = "normal";
export const TEXT_SIZE_STORAGE_KEY = "multiai-text-size";

const isTextSize = (v: unknown): v is TextSize =>
  typeof v === "string" && (TEXT_SIZES as readonly string[]).includes(v);

/** Runs before first paint (inline in <head>) so text never jumps size after loading. */
export const TEXT_SIZE_SCRIPT = `(function(){try{var v=localStorage.getItem("${TEXT_SIZE_STORAGE_KEY}");if(${JSON.stringify(
  TEXT_SIZES.filter((s) => s !== DEFAULT_TEXT_SIZE),
)}.indexOf(v)>=0)document.documentElement.dataset.textSize=v}catch(e){}})()`;

export function readTextSize(): TextSize {
  try {
    const v = localStorage.getItem(TEXT_SIZE_STORAGE_KEY);
    if (isTextSize(v)) return v;
  } catch {}
  return DEFAULT_TEXT_SIZE;
}

/** Saves the choice on this device and applies it to <html> at once. */
export function applyTextSize(size: TextSize) {
  try {
    localStorage.setItem(TEXT_SIZE_STORAGE_KEY, size);
  } catch {}
  if (size === DEFAULT_TEXT_SIZE)
    delete document.documentElement.dataset.textSize;
  else document.documentElement.dataset.textSize = size;
}
