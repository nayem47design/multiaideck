import { exportUserData } from "@/lib/auth/account";
import { requireUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { route } from "@/lib/server/api";

// GET /api/me/export — the user's profile, chats, payments and ledger as a JSON download.
export const GET = route(async () => {
  const user = await requireUser();
  const data = await exportUserData(await getDb(), user);
  const day = new Date().toISOString().slice(0, 10);
  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="multiaideck-data-${day}.json"`,
      "cache-control": "no-store",
    },
  });
});
