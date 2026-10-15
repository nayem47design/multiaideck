import { cx } from "../states";
import { AI_LOGOS, type AiBrand, type AiLogoStyle } from "./ai-logos.generated";

// Figma: Design system › AI logos › AI logo (268:41860), Brand × Style. The artwork is the
// brands' own (public/logos/ai, from scripts/generate-ai-logos.mjs), not UI tokens. Images, not
// inline SVG: they load once, are cached, and cost no JavaScript on low-end phones.

export type { AiBrand, AiLogoStyle };

export interface AiLogoProps {
  brand: AiBrand;
  /**
   * Figma's Style (Color, App icon, Black, White). "mono" is Black on the light theme and White
   * on the dark one.
   */
  style?: AiLogoStyle | "mono";
  /** A size-* class; Figma's artwork is 128px. */
  sizeClassName?: string;
  /** Accessible name; defaults to the brand ("Claude"). Pass "" when a label sits next to it. */
  label?: string;
  className?: string;
}

export function AiLogo({
  brand,
  style = "color",
  sizeClassName = "size-6",
  label,
  className,
}: AiLogoProps) {
  const { name, files } = AI_LOGOS[brand];
  const alt = label ?? name;
  const img = (src: string, extra?: string) => (
    // eslint-disable-next-line @next/next/no-img-element -- static brand artwork, sized by CSS
    <img
      src={src}
      alt={alt}
      aria-hidden={alt ? undefined : true}
      width={128}
      height={128}
      decoding="async"
      draggable={false}
      className={cx("shrink-0 select-none", sizeClassName, extra, className)}
    />
  );
  if (style !== "mono") return img(files[style]);
  return (
    <>
      {img(files.black, "dark:hidden")}
      {img(files.white, "hidden dark:block")}
    </>
  );
}
