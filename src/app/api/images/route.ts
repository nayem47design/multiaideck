import { after } from "next/server";

import { createImage, listImages } from "@/lib/ai/images";
import { requireUser } from "@/lib/auth/session";
import { CreateImageRequest, type Image } from "@/lib/contracts/account";
import { getDb } from "@/lib/db";
import { json, readBody, route } from "@/lib/server/api";

/** GET /api/images — the user's pictures, newest first. */
export const GET = route(async () => {
  const user = await requireUser();
  return json<{ images: Image[] }>({
    images: await listImages(await getDb(), user.id),
  });
});

/** POST /api/images — make a picture (~40 credits, held first; 402 when short). Poll until ready. */
export const POST = route(async (req: Request) => {
  const user = await requireUser();
  const body = await readBody(req, CreateImageRequest);
  const { image, job } = await createImage(await getDb(), user.id, body);
  after(() => job);
  return json<Image>(image, { status: 201 });
});
