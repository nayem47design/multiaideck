import { migrate as migratePglite } from "drizzle-orm/pglite/migrator";
import { migrate as migratePostgres } from "drizzle-orm/postgres-js/migrator";
import { join } from "node:path";

import { getDb } from "@/lib/db";
import { json, route } from "@/lib/server/api";
import { assertDev } from "@/lib/server/dev";
import { env } from "@/lib/server/env";

// Development only: apply new migrations to the running dev server's database without a restart.
export const POST = route(async () => {
  assertDev();
  const db = await getDb();
  const migrationsFolder = join(process.cwd(), "drizzle");
  if (env.DATABASE_URL) await migratePostgres(db, { migrationsFolder });
  else await migratePglite(db as never, { migrationsFolder });
  return json({ ok: true });
});
