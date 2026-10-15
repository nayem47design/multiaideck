import { useId } from "react";

import type { ModelId } from "@/lib/ai/models";

import { AiLogo, type AiBrand } from "../AiLogo";
import { cx } from "../states";
import { MODEL_LOGOS } from "./logos.generated";

// Figma: Design system › Model logo (Model × Tone). The provider's logo for a model, from the AI
// logo library (AiLogo): Tone=Brand is the brand's Color artwork, Tone=Mono the Black artwork (White
// on the dark theme). Grok's Color mark is white, so Brand uses Mono there, as in Figma. Llama has no
// artwork in the library; it keeps the Meta mark from @lobehub/icons-static-svg
// (scripts/generate-model-logos.mjs), whose Mono follows the text colour.

export type ModelLogoTone = "brand" | "mono";

/** Which AI logo each model shows. */
export const MODEL_BRANDS: Partial<Record<ModelId, AiBrand>> = {
  gpt: "chatgpt",
  o3: "chatgpt",
  claude: "claude",
  gemini: "gemini",
  deepseek: "deepseek",
  grok: "grok",
  perplexity: "perplexity",
  qwen: "qwen",
};

export interface ModelLogoProps {
  model: ModelId;
  tone?: ModelLogoTone;
  /** A size-* class; Figma's is 24px. */
  sizeClassName?: string;
  /** Accessible name; defaults to the provider ("ChatGPT"). Pass "" when a label sits next to it. */
  label?: string;
  className?: string;
}

export function ModelLogo({
  model,
  tone = "brand",
  sizeClassName = "size-6",
  label,
  className,
}: ModelLogoProps) {
  const brand = MODEL_BRANDS[model];
  if (brand)
    return (
      <AiLogo
        brand={brand}
        style={tone === "mono" || brand === "grok" ? "mono" : "color"}
        sizeClassName={sizeClassName}
        label={label}
        className={className}
      />
    );
  return (
    <InlineLogo
      model={model}
      tone={tone}
      sizeClassName={sizeClassName}
      label={label}
      className={className}
    />
  );
}

/** Logos not in the AI logo library (Llama), drawn inline. */
function InlineLogo({
  model,
  tone,
  sizeClassName,
  label,
  className,
}: Required<Omit<ModelLogoProps, "label" | "className">> &
  Pick<ModelLogoProps, "label" | "className">) {
  // Gradient and clip ids in the artwork must be unique per logo on the page.
  const uid = useId().replace(/:/g, "");
  const art = MODEL_LOGOS[model];
  if (!art) return null;
  const markup = (tone === "brand" ? art.brand : art.mono)
    .replace(/id="([^"]+)"/g, `id="$1-${uid}"`)
    .replace(/url\(#([^)]+)\)/g, `url(#$1-${uid})`);
  const name = label ?? art.title;

  return (
    <svg
      viewBox={art.viewBox}
      fill="currentColor"
      fillRule="evenodd"
      role={name ? "img" : undefined}
      aria-label={name || undefined}
      aria-hidden={name ? undefined : true}
      className={cx("shrink-0", sizeClassName, className)}
      dangerouslySetInnerHTML={{ __html: markup }}
    />
  );
}
