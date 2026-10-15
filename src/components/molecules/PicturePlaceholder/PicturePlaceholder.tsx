import type { HTMLAttributes, Ref } from "react";

import { cx } from "@/components/atoms/states";

// Figma: Prototype › Image studio › Recent › Picture 1–4 and Picture ready › "Picture (generated
// image placeholder)": a diagonal gradient standing in for a generated image, with the prompt's
// quoted text drawn on it. Figma's gradients are raw colours; these use the theme-independent
// iris and model tokens, so a picture looks the same in Light and Dark.

export type PictureTone = "warm" | "blue" | "green" | "pink";

export interface PicturePlaceholderProps extends HTMLAttributes<HTMLDivElement> {
  tone?: PictureTone;
  /** Text drawn on the picture (e.g. "Golpo Coffee"). */
  caption?: string;
  /** "lg" is the Picture ready size; "md" the M22 picture; "sm" a recent-pictures tile. */
  size?: "sm" | "md" | "lg";
  /** Shimmers while the picture is being made. */
  pending?: boolean;
  ref?: Ref<HTMLDivElement>;
}

const tones: Record<PictureTone, string> = {
  warm: "from-iris-pink via-model-claude to-model-grok",
  blue: "from-iris-cyan via-model-deepseek to-model-grok",
  green: "from-iris-cyan via-model-gpt to-model-grok",
  pink: "from-iris-pink via-iris-violet to-model-grok",
};

const sizes = {
  sm: "rounded-images-tile",
  md: "rounded-xl p-6",
  // Below 768px the Picture ready picture is M22's (smaller inset and caption).
  lg: "rounded-xl p-images-picture-pad max-md:p-6",
};

const captions = {
  sm: "hidden",
  md: "type-images-picture-caption-mobile",
  lg: "type-images-picture-caption max-md:type-images-picture-caption-mobile",
};

export function PicturePlaceholder({
  tone = "warm",
  caption,
  size = "lg",
  pending = false,
  className,
  ref,
  ...props
}: PicturePlaceholderProps) {
  return (
    <div
      ref={ref}
      data-tone={tone}
      className={cx(
        "relative flex aspect-square w-full flex-col justify-end overflow-hidden bg-linear-135",
        tones[tone],
        sizes[size],
        pending &&
          "animate-pulse [animation-duration:var(--duration-ambient)] motion-reduce:animate-none",
        className,
      )}
      {...props}
    >
      {caption && !pending && (
        <span className={cx("text-orb-initial", captions[size])}>
          {caption}
        </span>
      )}
    </div>
  );
}
