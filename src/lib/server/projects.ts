import "server-only";

import { and, asc, count, eq, isNull, ne, sql } from "drizzle-orm";

import { listChats } from "@/lib/ai/chats";
import type { Project, ProjectDetail } from "@/lib/contracts/projects";
import type { Db } from "@/lib/db";
import { chats, projects } from "@/lib/db/schema";
import { ApiError } from "@/lib/server/api";

// Projects: folders of related chats (src/lib/contracts/projects.ts). Owner-only: every function
// takes the signed-in user's id and treats another user's project as not found. Deleting a project
// is soft and moves its chats out first; chats are never deleted with their project.

type ProjectRow = typeof projects.$inferSelect;

const toProject = (p: ProjectRow, chatCount: number): Project => ({
  id: p.id,
  name: p.name,
  chatCount,
  createdAt: p.createdAt.toISOString(),
  updatedAt: p.updatedAt.toISOString(),
});

/** The user's live project, or 404. */
export async function ownProject(db: Db, userId: string, projectId: string) {
  const [row] = await db
    .select()
    .from(projects)
    .where(
      and(
        eq(projects.id, projectId),
        eq(projects.userId, userId),
        isNull(projects.deletedAt),
      ),
    );
  if (!row) throw new ApiError(404, "not_found");
  return row;
}

async function chatCount(db: Db, projectId: string) {
  const [{ n }] = await db
    .select({ n: count() })
    .from(chats)
    .where(and(eq(chats.projectId, projectId), isNull(chats.deletedAt)));
  return n;
}

/** Names are unique per user, ignoring case (live projects only). */
async function assertNameFree(
  db: Db,
  userId: string,
  name: string,
  exceptId?: string,
) {
  const [taken] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(
      and(
        eq(projects.userId, userId),
        isNull(projects.deletedAt),
        sql`lower(${projects.name}) = lower(${name})`,
        exceptId ? ne(projects.id, exceptId) : undefined,
      ),
    );
  if (taken)
    throw new ApiError(409, "conflict", "A project with this name exists", {
      field: "name",
    });
}

/** A unique-index race (two creates at once) is the same conflict. */
function isUniqueViolation(e: unknown) {
  const err = e as { code?: string; cause?: { code?: string } };
  return err?.code === "23505" || err?.cause?.code === "23505";
}

/** The user's projects, oldest first (the sidebar order), with their chat counts. */
export async function listProjects(db: Db, userId: string): Promise<Project[]> {
  const rows = await db
    .select({ project: projects, chatCount: count(chats.id) })
    .from(projects)
    .leftJoin(
      chats,
      and(eq(chats.projectId, projects.id), isNull(chats.deletedAt)),
    )
    .where(and(eq(projects.userId, userId), isNull(projects.deletedAt)))
    .groupBy(projects.id)
    .orderBy(asc(projects.createdAt), asc(projects.name));
  return rows.map((r) => toProject(r.project, Number(r.chatCount)));
}

export async function createProject(
  db: Db,
  userId: string,
  name: string,
): Promise<Project> {
  await assertNameFree(db, userId, name);
  try {
    const [row] = await db
      .insert(projects)
      .values({ userId, name })
      .returning();
    return toProject(row, 0);
  } catch (e) {
    if (isUniqueViolation(e)) throw new ApiError(409, "conflict");
    throw e;
  }
}

export async function projectDetail(
  db: Db,
  userId: string,
  projectId: string,
): Promise<ProjectDetail> {
  const row = await ownProject(db, userId, projectId);
  const list = await listChats(db, userId, { projectId });
  return { ...toProject(row, list.length), chats: list };
}

export async function renameProject(
  db: Db,
  userId: string,
  projectId: string,
  name: string,
): Promise<Project> {
  const row = await ownProject(db, userId, projectId);
  await assertNameFree(db, userId, name, row.id);
  try {
    const [updated] = await db
      .update(projects)
      .set({ name, updatedAt: new Date() })
      .where(eq(projects.id, row.id))
      .returning();
    return toProject(updated, await chatCount(db, row.id));
  } catch (e) {
    if (isUniqueViolation(e)) throw new ApiError(409, "conflict");
    throw e;
  }
}

/** Soft delete: its chats move out of the project first (they stay in the chat list). */
export async function deleteProject(db: Db, userId: string, projectId: string) {
  const row = await ownProject(db, userId, projectId);
  await db.transaction(async (tx) => {
    await tx
      .update(chats)
      .set({ projectId: null })
      .where(and(eq(chats.projectId, row.id), eq(chats.userId, userId)));
    await tx
      .update(projects)
      .set({ deletedAt: new Date() })
      .where(eq(projects.id, row.id));
  });
}
