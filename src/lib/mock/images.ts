// Image studio demo data: recent pictures and the simulated generation. Pictures are drawn as
// token-coloured gradients (as Figma does) until an image model is wired up (Phase 6).

import type { ModelId } from "@/lib/ai/models";

export type PictureStyle = "photo" | "drawing" | "logo" | "poster";
export const PICTURE_STYLES: PictureStyle[] = [
  "photo",
  "drawing",
  "logo",
  "poster",
];

/** Gradient placeholder, see molecules/PicturePlaceholder. */
export type PictureTone = "warm" | "blue" | "green" | "pink";

export interface DemoPicture {
  id: string;
  /** Chat title (user content). */
  title: string;
  prompt: string;
  style: PictureStyle;
  tone: PictureTone;
  /** Text drawn on the picture, when the prompt asks for some. */
  caption?: string;
  credits: number;
}

/** About 40 credits (৳0.40) a picture. */
export const PICTURE_CREDITS = 40;
/** How long the demo "generation" takes. */
export const PICTURE_DELAY_MS = 2400;
/** The image AI shown with picture chats (Figma draws the Gemini orb). */
export const IMAGE_MODEL: ModelId = "gemini";

export const DEMO_PICTURES: DemoPicture[] = [
  {
    id: "golpo-coffee-sign",
    title: "Golpo Coffee sign",
    prompt: "A cosy coffee shop sign that says “Golpo Coffee”, warm colours",
    style: "drawing",
    tone: "warm",
    caption: "Golpo Coffee",
    credits: PICTURE_CREDITS,
  },
  {
    id: "rainy-dhaka-evening",
    title: "Rainy Dhaka evening",
    prompt: "A rainy evening street in Dhaka with rickshaws, soft blue light",
    style: "photo",
    tone: "blue",
    credits: PICTURE_CREDITS,
  },
  {
    id: "tea-garden-poster",
    title: "Tea garden poster",
    prompt: "A poster of the Sreemangal tea gardens at sunrise",
    style: "poster",
    tone: "green",
    credits: PICTURE_CREDITS,
  },
  {
    id: "shapla-logo",
    title: "Shapla logo",
    prompt: "A simple pink water-lily logo for a flower shop",
    style: "logo",
    tone: "pink",
    credits: PICTURE_CREDITS,
  },
];

export const DEFAULT_PROMPT = DEMO_PICTURES[0].prompt;

/** Text in quotes in the prompt becomes the caption on the demo picture ("Golpo Coffee"). */
export function captionFrom(prompt: string) {
  return /[“"]([^”"]+)[”"]/.exec(prompt)?.[1];
}

/** A short title for a new picture: the caption, or the first few words of the prompt. */
export function titleFrom(prompt: string) {
  const caption = captionFrom(prompt);
  if (caption) return caption;
  const words = prompt.trim().split(/\s+/).slice(0, 4).join(" ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** Where a chat row opens: picture chats open in Image studio (they have no /c page). */
export function chatHref(chat: { id: string; kind: string }) {
  if (chat.kind !== "image") return `/c/${chat.id}`;
  return DEMO_PICTURES.some((p) => p.id === chat.id)
    ? `/images?picture=${chat.id}`
    : "/images";
}

/** The orbs a chat row shows: picture chats show the image AI. */
export function chatModels(chat: { kind: string; models: ModelId[] }) {
  return chat.kind === "image" && !chat.models.length
    ? [IMAGE_MODEL]
    : chat.models;
}
