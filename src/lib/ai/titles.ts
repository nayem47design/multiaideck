import { stripCues } from "./demo";

// A chat's title from its first prompt: short, no model call. "Give me 3 name ideas for a small
// coffee shop in Dhaka" → "Give me 3 name ideas for a small…". (A model-written title can replace
// it later; the user can rename.)

const MAX_CHARS = 40;

export function titleFromPrompt(text: string) {
  const line =
    stripCues(text)
      .split("\n")
      .map((l) => l.trim())
      .find(Boolean) ?? "";
  const clean = line.replace(/[\s.,;:!?]+$/u, "");
  if (clean.length <= MAX_CHARS) return capitalise(clean) || "New chat";
  const cut = clean.slice(0, MAX_CHARS);
  const space = cut.lastIndexOf(" ");
  return `${capitalise(space > 20 ? cut.slice(0, space) : cut)}…`;
}

const capitalise = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
