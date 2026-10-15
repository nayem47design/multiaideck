import "server-only";

import { generateText, Output } from "ai";
import { z } from "zod";

import { MERGE_MAX_OUTPUT, tokensOf } from "@/lib/billing/pricing";
import { COFFEE_CHAT, simpleChat, type DemoBestAnswer } from "@/lib/mock/chat";

import { MODEL_SPECS } from "./catalog";
import { stripCues } from "./demo";
import { MODEL_IDS, type ModelId } from "./models";
import { resolveMergeModel } from "./providers";

// Best answer: the merge step. After the answers finish, a separate summariser call reads the
// prompt and the finished answers and writes an intro plus a few points, each citing the model it
// came from.
//
// AGENTS.md rule 7, as applied here: answering models never see each other's answers. The merge
// step is not an answering model: its output is stored in best_answers and is NEVER added to any
// model's history (histories are built from the user's prompts and that model's own answers only;
// see history.ts). It runs once per prompt and is charged on its own hold ("best_answer").

export interface MergeInput {
  prompt: string;
  answers: { model: ModelId; text: string }[];
}

export interface MergePoint {
  lead: string;
  text: string;
  model: ModelId;
}

export interface MergeResult {
  intro: string;
  points: MergePoint[];
  inputTokens: number;
  outputTokens: number;
  version: string;
}

const INSTRUCTIONS =
  "You merge several independent AI answers to the same question into one best answer. " +
  "Write a one-sentence intro, then 2 to 5 points. Each point has a short lead (a name or idea, " +
  "no trailing colon), one sentence of text, and the id of the model whose answer it came from. " +
  "Only use ideas that appear in the answers. Answer in the language of the question.";

const Schema = z.object({
  intro: z.string(),
  points: z
    .array(
      z.object({
        lead: z.string(),
        text: z.string(),
        model: z.enum(MODEL_IDS as [ModelId, ...ModelId[]]),
      }),
    )
    .min(1)
    .max(6),
});

export async function merge(
  input: MergeInput,
  {
    signal,
    onPoint,
    useDemo = false,
  }: {
    signal?: AbortSignal;
    /** Called as points arrive (demo) or once at the end (provider). */
    onPoint?: (partial: { intro: string; points: MergePoint[] }) => void;
    useDemo?: boolean;
  } = {},
): Promise<MergeResult> {
  const real = useDemo ? null : resolveMergeModel();
  if (real) {
    const prompt = [
      `Question: ${input.prompt}`,
      ...input.answers.map(
        (a) =>
          `--- Answer from model "${a.model}" (${MODEL_SPECS[a.model].name}):\n${a.text}`,
      ),
    ].join("\n\n");
    const result = await generateText({
      model: real.model,
      instructions: INSTRUCTIONS,
      prompt,
      output: Output.object({ schema: Schema }),
      maxOutputTokens: MERGE_MAX_OUTPUT,
      abortSignal: signal,
    });
    const out = result.output;
    const allowed = new Set(input.answers.map((a) => a.model));
    const points = out.points.filter((p) => allowed.has(p.model));
    onPoint?.({ intro: out.intro, points });
    return {
      intro: out.intro,
      points,
      inputTokens: result.usage.inputTokens ?? tokensOf(prompt),
      outputTokens: result.usage.outputTokens ?? tokensOf(JSON.stringify(out)),
      version: real.version,
    };
  }
  return demoMerge(input, { signal, onPoint });
}

// ---- Demo merge: the prototype's Best answers for its prompts, else the first list item of each
// answer. Streams point by point.

const SCRIPTED = new Map<string, DemoBestAnswer>([
  [COFFEE_CHAT.prompts.p1.text, COFFEE_CHAT.best],
  ...(["hellow", "who-are-you", "how-old-are-you"] as const).map(
    (id) =>
      [simpleChat(id)!.prompt.text, simpleChat(id)!.best] as [
        string,
        DemoBestAnswer,
      ],
  ),
]);

const POINT_DELAY_MS = 350;
let delayFactor = 1;
/** Tests: make the demo merge instant. */
export function setMergeDelay(factor: number) {
  delayFactor = factor;
}

function sleep(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) return reject(signal.reason);
    const t = setTimeout(resolve, ms * delayFactor);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(t);
        reject(signal.reason);
      },
      { once: true },
    );
  });
}

/** "2. Cha & Crema: mixes tea and espresso." → { lead: "Cha & Crema", text: "Mixes tea…" } */
function pointsOf(text: string) {
  const items: { lead: string; text: string }[] = [];
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const m = /^\s*(?:\d+[.)]|[-*•])\s+(.+)$/.exec(lines[i]);
    if (!m) continue;
    const body = m[1].trim();
    const colon = body.search(/[:–—]\s/);
    if (colon > 0)
      items.push({
        lead: body.slice(0, colon).trim(),
        text: capitalise(body.slice(colon + 1).trim()),
      });
    else {
      const next = lines[i + 1]?.trim();
      const tagline = next && !/^\s*\d+[.)]/.test(next) ? next : "";
      items.push({ lead: body, text: tagline });
    }
  }
  return items;
}

const capitalise = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

async function demoMerge(
  input: MergeInput,
  {
    signal,
    onPoint,
  }: {
    signal?: AbortSignal;
    onPoint?: (partial: { intro: string; points: MergePoint[] }) => void;
  },
): Promise<MergeResult> {
  const answered = new Set(input.answers.map((a) => a.model));
  const scripted = SCRIPTED.get(stripCues(input.prompt));
  let intro: string;
  let points: MergePoint[];
  if (scripted && scripted.ideas.every((i) => answered.has(i.model))) {
    intro = scripted.intro;
    points = scripted.ideas.map((i) => ({
      lead: i.name,
      text: i.text,
      model: i.model,
    }));
  } else {
    intro =
      input.answers.length > 1
        ? `Here are the strongest ideas from all ${input.answers.length} answers:`
        : `${MODEL_SPECS[input.answers[0].model].short}’s answer:`;
    points = [];
    const used = new Set<string>();
    for (const a of input.answers) {
      const items = pointsOf(a.text);
      const pick = items.find((p) => !used.has(p.lead.toLowerCase()));
      if (pick) {
        used.add(pick.lead.toLowerCase());
        points.push({ ...pick, model: a.model });
      } else {
        const first = a.text.split(/(?<=[.!?])\s/)[0]?.trim() ?? a.text;
        points.push({
          lead: MODEL_SPECS[a.model].short,
          text: first,
          model: a.model,
        });
      }
    }
  }

  const shown: MergePoint[] = [];
  onPoint?.({ intro, points: [] });
  for (const p of points) {
    await sleep(POINT_DELAY_MS, signal);
    shown.push(p);
    onPoint?.({ intro, points: [...shown] });
  }
  const inputText = [input.prompt, ...input.answers.map((a) => a.text)].join(
    "\n",
  );
  const outputText = [intro, ...points.map((p) => `${p.lead}: ${p.text}`)].join(
    "\n",
  );
  return {
    intro,
    points,
    inputTokens: tokensOf(inputText),
    outputTokens: tokensOf(outputText),
    version: "demo",
  };
}
