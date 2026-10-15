import { estimateFor } from "@/lib/ai/orchestrator";
import { requireUser } from "@/lib/auth/session";
import { estimatePrompt } from "@/lib/billing/pricing";
import { credits } from "@/lib/billing/units";
import { EstimateRequest, type EstimateResponse } from "@/lib/contracts/chat";
import { getDb } from "@/lib/db";
import { json, readBody, route } from "@/lib/server/api";

/** POST /api/estimate — "≈ min to max" credits for a prompt, and catch-up per model. */
export const POST = route(async (req: Request) => {
  const user = await requireUser();
  const body = await readBody(req, EstimateRequest);
  const inputs = await estimateFor(await getDb(), user.id, body);
  const e = estimatePrompt(inputs, { best: body.mode === "best" });
  const round = (mcr: number) => Math.round(credits(mcr) * 10) / 10;
  return json<EstimateResponse>({
    minCredits: round(e.minMcr),
    maxCredits: round(e.maxMcr),
    catchUp: e.catchUp.map((c) => ({ model: c.model, credits: round(c.mcr) })),
  });
});
