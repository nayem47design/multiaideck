import "server-only";

import { PGlite } from "@electric-sql/pglite";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { migrate as migratePglite } from "drizzle-orm/pglite/migrator";
import {
  drizzle as drizzlePostgres,
  type PostgresJsDatabase,
} from "drizzle-orm/postgres-js";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import postgres from "postgres";

import { env } from "@/lib/server/env";

import * as schema from "./schema";

// One database handle per process. With DATABASE_URL: Postgres (migrate with `npm run
// db:migrate`). Without: PGlite, an embedded Postgres in .data/pglite that migrates itself, so
// development needs no database server. Tests inject an in-memory PGlite (see ./testing.ts).

export type Db = PostgresJsDatabase<typeof schema>;
export { schema };

const MIGRATIONS = join(process.cwd(), "drizzle");

type Holder = { db?: Promise<Db> };
const holder = globalThis as unknown as { __multiaiDb?: Holder };
const state: Holder = (holder.__multiaiDb ??= {});

export function getDb(): Promise<Db> {
  return (state.db ??= open());
}

/** Tests only: use this database for the rest of the process. */
export function setDb(db: Db | Promise<Db>) {
  state.db = Promise.resolve(db);
}

async function open(): Promise<Db> {
  if (env.DATABASE_URL) {
    const client = postgres(env.DATABASE_URL, { max: 10 });
    return drizzlePostgres(client, { schema });
  }
  const dir = join(process.cwd(), ".data/pglite");
  mkdirSync(dir, { recursive: true });
  return openPglite(dir);
}

/** A migrated PGlite database at `dataDir`, or in memory when omitted. */
export async function openPglite(dataDir?: string): Promise<Db> {
  const client = new PGlite(dataDir);
  const db = drizzlePglite(client, { schema });
  await migratePglite(db, { migrationsFolder: MIGRATIONS });
  return db as unknown as Db;
}
