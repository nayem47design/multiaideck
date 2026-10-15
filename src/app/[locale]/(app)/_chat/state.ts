// Deep links for the composer and the chat screens (for tests and reviews), all optional:
//   ?composer=menu|voice|voice-ready|files   the composer's “+” menu, voice, or files state
//   &sheet=mode|models                       mobile sheets (M7, M25) or the desktop model picker
//   &tab=<model>                             mobile Compare: which answer is shown
// The chat's content itself comes from the API (no scripted steps any more).

import { MODEL_IDS, type ModelId } from "@/lib/ai/models";

export type ComposerPreset = "menu" | "voice" | "voice-ready" | "files";
export type SheetPreset = "mode" | "models";

export interface ChatParams {
  tab?: ModelId;
  composer?: ComposerPreset;
  sheet?: SheetPreset;
}

const pick = <T extends string>(v: string | null, list: readonly T[]) =>
  v && (list as readonly string[]).includes(v) ? (v as T) : undefined;

export function parseParams(sp: URLSearchParams): ChatParams {
  return {
    tab: pick(sp.get("tab"), MODEL_IDS),
    composer: pick(sp.get("composer"), [
      "menu",
      "voice",
      "voice-ready",
      "files",
    ] as const),
    sheet: pick(sp.get("sheet"), ["mode", "models"] as const),
  };
}
