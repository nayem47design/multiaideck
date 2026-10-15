import { useId } from "react";

import type { ModelId } from "@/lib/ai/models";

import { cx } from "../states";
import { MODEL_LOGOS } from "./logos.generated";

// Figma: Design system › Model logo (Model × Tone). The provider's logo for a model, from
// @lobehub/icons-static-svg (see scripts/generate-model-logos.mjs). Brand colours are the
// providers' artwork, not UI tokens; Tone=Mono follows the text colour (currentColor).

export type ModelLogoTone = "brand" | "mono";

export interface ModelLogoProps {
  model: ModelId;
  tone?: ModelLogoTone;
  /** A size-* class; Figma's is 24px. */
  sizeClassName?: string;
  /** Accessible name; defaults to the provider ("OpenAI"). Pass "" when a label sits next to it. */
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
  const art = MODEL_LOGOS[model];
  // Gradient and clip ids in the artwork must be unique per logo on the page.
  const uid = useId().replace(/:/g, "");
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
