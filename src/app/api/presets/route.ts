import { createPreset, listPresets } from "@/lib/ai/presets";
import { requireUser } from "@/lib/auth/session";
import { PresetInput, type Preset } from "@/lib/contracts/account";
import { getDb } from "@/lib/db";
import { json, readBody, route } from "@/lib/server/api";

/** GET /api/presets — the user's presets (the built-in four on first use). */
export const GET = route(async () => {
  const user = await requireUser();
  return json<{ presets: Preset[] }>({
    presets: await listPresets(await getDb(), user.id),
  });
});

/** POST /api/presets — a new preset. */
export const POST = route(async (req: Request) => {
  const user = await requireUser();
  const body = await readBody(req, PresetInput);
  return json<Preset>(await createPreset(await getDb(), user.id, body), {
    status: 201,
  });
});
