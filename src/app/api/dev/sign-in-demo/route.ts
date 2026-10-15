import { meResponse } from "@/lib/auth/account";
import { createSession, destroySession } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { seedDemo } from "@/lib/db/seed";
import { json, route } from "@/lib/server/api";
import { assertDev } from "@/lib/server/dev";

// Development only (404 in production): seed the demo data and sign in as the demo user. Each call
// starts a new session, so e2e tests that sign out don't end anyone else's.
export const POST = route(async (req: Request) => {
  assertDev();
  const db = await getDb();
  const user = await seedDemo(db);
  await destroySession();
  await createSession(user.id, req.headers.get("user-agent"));
  return json(await meResponse(db, user));
});
