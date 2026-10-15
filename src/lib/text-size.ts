// Text size preference ("Easy reading", M15; Settings › Profile on desktop): Normal, Large, Larger.
// Stored per device in localStorage and applied as <html data-text-size>, which sets --type-scale
// (styles/effects.css); every text style multiplies Figma's sizes by it (styles/typography.css,
// components.css). Server-safe: the layout imports TEXT_SIZE_SCRIPT.

export type TextSize = "normal" | "large" | "larger";
export const TEXT_SIZES: readonly TextSize[] = ["normal", "large", "larger"];
export const TEXT_SIZE_STORAGE_KEY = "multiai-text-size";

/** Runs before first paint (inline in <head>) so text never jumps size after loading. */
export const TEXT_SIZE_SCRIPT = `(function(){try{var v=localStorage.getItem("${TEXT_SIZE_STORAGE_KEY}");if(v==="large"||v==="larger")document.documentElement.dataset.textSize=v}catch(e){}})()`;

export function readTextSize(): TextSize {
  try {
    const v = localStorage.getItem(TEXT_SIZE_STORAGE_KEY);
    if (v === "large" || v === "larger") return v;
  } catch {}
  return "normal";
}
