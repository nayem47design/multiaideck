import "server-only";

import { and, eq, inArray, isNull, sql } from "drizzle-orm";

import type { Db } from "@/lib/db";
import { chats, projects } from "@/lib/db/schema";

// The prototype's three projects for the demo user ("9 · Projects & account menu"). Figma's
// "Project · MultiAI launch" page lists the five demo chats, so they are all filed there; Coffee
// brand and Thesis research start empty (Figma's sidebar counts 12 / 5 / 8 are illustrative: the
// demo data has five chats, and a chat is in at most one project). Idempotent: an existing project
// (by name) is kept, and chats the user has moved elsewhere are left alone.

export const DEMO_PROJECTS = [
  {
    name: "MultiAI launch",
    chats: [
      "coffee-shop-names",
      "golpo-coffee-sign",
      "hellow",
      "who-are-you",
      "how-old-are-you",
    ],
  },
  { name: "Coffee brand", chats: [] },
  { name: "Thesis research", chats: [] },
] as const;

export async function seedProjects(db: Db, userId: string) {
  for (const [i, p] of DEMO_PROJECTS.entries()) {
    let [row] = await db
      .select()
      .from(projects)
      .where(
        and(
          eq(projects.userId, userId),
          isNull(projects.deletedAt),
          sql`lower(${projects.name}) = lower(${p.name})`,
        ),
      );
    if (row) continue; // already seeded (or made by the user): leave it and its chats as they are
    // Created a second apart, so the sidebar keeps Figma's order.
    const at = new Date(Date.now() - (DEMO_PROJECTS.length - i) * 1000);
    [row] = await db
      .insert(projects)
      .values({ userId, name: p.name, createdAt: at, updatedAt: at })
      .returning();
    if (p.chats.length)
      await db
        .update(chats)
        .set({ projectId: row.id })
        .where(
          and(
            eq(chats.userId, userId),
            inArray(chats.id, [...p.chats]),
            isNull(chats.projectId),
          ),
        );
  }
}
