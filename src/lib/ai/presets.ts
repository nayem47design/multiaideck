import "server-only";

import { and, asc, eq, ne } from "drizzle-orm";

import type { Preset } from "@/lib/contracts/account";
import type { Db } from "@/lib/db";
import { presets } from "@/lib/db/schema";
import { ApiError } from "@/lib/server/api";

import { lockUser } from "./holds";
import type { ModelId } from "./models";

// Presets: saved sets of AIs. A new user gets the four built-in presets on their first list, with
// "Recommended" in use. Built-in presets store a key ("@recommended") instead of a name, so the
// screens show the name in the user's language (messages presets.items.<key>); a user's own
// presets carry their own name (which may not start with "@").

export const BUILT_IN_PREFIX = "@";

export const DEFAULT_PRESETS: { key: string; models: ModelId[] }[] = [
  { key: "recommended", models: ["gpt", "claude", "gemini"] },
  { key: "cheapest", models: ["gemini", "deepseek", "grok"] },
  { key: "bangla", models: ["claude", "gpt", "gemini"] },
  { key: "writing", models: ["claude", "gpt"] },
];

type Row = typeof presets.$inferSelect;
const toPreset = (p: Row): Preset => ({
  id: p.id,
  name: p.name,
  models: p.models,
  inUse: p.inUse,
});

async function rows(db: Db, userId: string) {
  return db
    .select()
    .from(presets)
    .where(eq(presets.userId, userId))
    .orderBy(asc(presets.createdAt));
}

export async function listPresets(db: Db, userId: string): Promise<Preset[]> {
  let list = await rows(db, userId);
  if (!list.length) {
    await db.transaction(async (tx) => {
      await lockUser(tx, userId);
      const again = await tx
        .select({ id: presets.id })
        .from(presets)
        .where(eq(presets.userId, userId));
      if (again.length) return;
      const now = Date.now();
      await tx.insert(presets).values(
        DEFAULT_PRESETS.map((p, i) => ({
          userId,
          name: `${BUILT_IN_PREFIX}${p.key}`,
          models: p.models,
          inUse: i === 0,
          createdAt: new Date(now + i),
        })),
      );
    });
    list = await rows(db, userId);
  }
  return list.map(toPreset);
}

function checkName(name: string) {
  if (name.startsWith(BUILT_IN_PREFIX))
    throw new ApiError(400, "invalid_input", "Name can't start with @");
}

export async function createPreset(
  db: Db,
  userId: string,
  input: { name: string; models: ModelId[] },
): Promise<Preset> {
  checkName(input.name);
  await listPresets(db, userId);
  const [row] = await db
    .insert(presets)
    .values({ userId, name: input.name, models: input.models })
    .returning();
  return toPreset(row);
}

export async function updatePreset(
  db: Db,
  userId: string,
  id: string,
  patch: { name?: string; models?: ModelId[]; inUse?: boolean },
): Promise<Preset> {
  const [current] = await db
    .select()
    .from(presets)
    .where(and(eq(presets.id, id), eq(presets.userId, userId)));
  if (!current) throw new ApiError(404, "not_found");
  if (patch.name !== undefined && patch.name !== current.name)
    checkName(patch.name);
  const row = await db.transaction(async (tx) => {
    if (patch.inUse)
      await tx
        .update(presets)
        .set({ inUse: false })
        .where(and(eq(presets.userId, userId), ne(presets.id, id)));
    const [r] = await tx
      .update(presets)
      .set({
        ...(patch.name !== undefined ? { name: patch.name } : {}),
        ...(patch.models ? { models: patch.models } : {}),
        ...(patch.inUse !== undefined ? { inUse: patch.inUse } : {}),
      })
      .where(eq(presets.id, id))
      .returning();
    return r;
  });
  return toPreset(row);
}

export async function deletePreset(db: Db, userId: string, id: string) {
  const [current] = await db
    .select()
    .from(presets)
    .where(and(eq(presets.id, id), eq(presets.userId, userId)));
  if (!current) throw new ApiError(404, "not_found");
  await db.delete(presets).where(eq(presets.id, id));
  if (current.inUse) {
    const [first] = await rows(db, userId);
    if (first)
      await db
        .update(presets)
        .set({ inUse: true })
        .where(eq(presets.id, first.id));
  }
}
