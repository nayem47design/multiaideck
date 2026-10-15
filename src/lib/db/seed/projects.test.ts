// @vitest-environment node
import { beforeAll, describe, expect, it } from "vitest";

import type { Db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { useTestDb } from "@/lib/db/testing";
import { listProjects, projectDetail } from "@/lib/server/projects";

import { seedChats } from "./chats";
import { seedProjects } from "./projects";

let db: Db;
let userId: string;

beforeAll(async () => {
  db = await useTestDb();
  [{ id: userId }] = await db
    .insert(users)
    .values({ phone: "+8801712345214" })
    .returning();
  await seedChats(db, userId);
});

describe("demo projects seed", () => {
  it("files the demo chats in MultiAI launch and is idempotent", async () => {
    await seedProjects(db, userId);
    await seedProjects(db, userId);
    const list = await listProjects(db, userId);
    expect(list.map((p) => [p.name, p.chatCount])).toEqual([
      ["MultiAI launch", 5],
      ["Coffee brand", 0],
      ["Thesis research", 0],
    ]);
    const launch = await projectDetail(db, userId, list[0].id);
    expect(launch.chats.map((c) => c.title)).toContain("Coffee shop names");
  });
});
