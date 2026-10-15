import { stopPrompt } from "@/lib/ai/orchestrator";
import { requireUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { route } from "@/lib/server/api";

/** POST /api/prompts/:id/stop — unfinished answers stop and cost nothing. */
export const POST = route(
  async (_req: Request, ctx: RouteContext<"/api/prompts/[id]/stop">) => {
    const user = await requireUser();
    const { id } = await ctx.params;
    await stopPrompt(await getDb(), user.id, id);
    return new Response(null, { status: 204 });
  },
);
