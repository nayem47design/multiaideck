import { openPglite, setDb, type Db } from "./index";

/** A fresh, migrated in-memory database for one test file; also used by every getDb() call. */
export async function useTestDb(): Promise<Db> {
  const db = await openPglite();
  setDb(db);
  return db;
}
