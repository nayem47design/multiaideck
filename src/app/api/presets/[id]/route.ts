import { z } from "zod";

import { deletePreset, updatePreset } from "@/lib/ai/presets";
import { requireUser } from "@/lib/auth/session";
import { PresetInput, type Preset } from "@/lib/contracts/account";
import { getDb } from "@/lib/db";
import { json, readBody, route } from "@/lib/server/api";

type Ctx = RouteContext<"/api/presets/[id]">;

const Patch = PresetInput.partial().extend({ inUse: z.boolean().optional() });

/** PATCH /api/presets/:id — rename, change models, or put in use. */
export const PATCH = route(async (req: Request, ctx: Ctx) => {
  const user = await requireUser();
  const { id } = await ctx.params;
  const body = await readBody(req, Patch);
  return json<Preset>(await updatePreset(await getDb(), user.id, id, body));
});

/** DELETE /api/presets/:id */
export const DELETE = route(async (_req: Request, ctx: Ctx) => {
  const user = await requireUser();
  const { id } = await ctx.params;
  await deletePreset(await getDb(), user.id, id);
  return new Response(null, { status: 204 });
});
