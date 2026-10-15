import { getImage } from "@/lib/ai/images";
import { requireUser } from "@/lib/auth/session";
import type { Image } from "@/lib/contracts/account";
import { getDb } from "@/lib/db";
import { json, route } from "@/lib/server/api";

/** GET /api/images/:id */
export const GET = route(
  async (_req: Request, ctx: RouteContext<"/api/images/[id]">) => {
    const user = await requireUser();
    const { id } = await ctx.params;
    const { image } = await getImage(await getDb(), user.id, id);
    return json<Image>(image);
  },
);
