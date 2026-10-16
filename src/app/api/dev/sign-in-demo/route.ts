import { eq } from "drizzle-orm";

import { meResponse } from "@/lib/auth/account";
import { createSession } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { DEMO_PHONE, seedDemo } from "@/lib/db/seed";
import { json, route } from "@/lib/server/api";
import { assertDevOrDemo } from "@/lib/server/dev";
import { demoMode } from "@/lib/server/env";

// Development only (404 in production): seed the demo data and sign in as the demo user. Each call
// starts a new session and leaves any other session alone, so e2e tests that sign out end only
// their own.
// Also on a demo deployment (NEXT_PUBLIC_DEMO_MODE=1): the "Try the demo" button.
export const POST = route(async (req: Request) => {
  assertDevOrDemo();
  const db = await getDb();
  // A demo deployment seeds once (the first visitor) and then only signs in: the seed is hundreds
  // of queries. Development re-seeds every time, so new seed data shows up without a reset.
  const [seeded] = demoMode()
    ? await db.select().from(users).where(eq(users.phone, DEMO_PHONE))
    : [];
  // Parallel e2e workers may seed at the same moment; the seed is idempotent, so try again.
  const user = seeded ?? (await seedDemo(db).catch(() => seedDemo(db)));
  await createSession(user.id, req.headers.get("user-agent"));
  return json(await meResponse(db, user));
});
