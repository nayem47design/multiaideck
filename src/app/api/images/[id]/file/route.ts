import { getImage, imageFile } from "@/lib/ai/images";
import { requireUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { route } from "@/lib/server/api";

/** GET /api/images/:id/file — the picture (PNG), for the owner only. */
export const GET = route(
  async (_req: Request, ctx: RouteContext<"/api/images/[id]/file">) => {
    const user = await requireUser();
    const { id } = await ctx.params;
    const { row } = await getImage(await getDb(), user.id, id);
    const { body, contentType } = imageFile(row);
    return new Response(new Uint8Array(body), {
      headers: {
        "content-type": contentType,
        "cache-control": "private, max-age=31536000, immutable",
      },
    });
  },
);
