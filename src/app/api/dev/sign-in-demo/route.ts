import { meResponse } from "@/lib/auth/account";
import { createSession } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { seedDemo } from "@/lib/db/seed";
import { json, route } from "@/lib/server/api";
import { assertDev } from "@/lib/server/dev";

// Development only (404 in production): seed the demo data and sign in as the demo user. Each call
// starts a new session and leaves any other session alone, so e2e tests that sign out end only
// their own.
export const POST = route(async (req: Request) => {
  assertDev();
  const db = await getDb();
  // Parallel e2e workers may seed at the same moment; the seed is idempotent, so try again.
  const user = await seedDemo(db).catch(() => seedDemo(db));
  await createSession(user.id, req.headers.get("user-agent"));
  return json(await meResponse(db, user));
});
