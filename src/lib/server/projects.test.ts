// @vitest-environment node
import { beforeAll, describe, expect, it } from "vitest";

import { listChats, updateChat } from "@/lib/ai/chats";
import type { Db } from "@/lib/db";
import { chats, users } from "@/lib/db/schema";
import { useTestDb } from "@/lib/db/testing";
import { ApiError } from "@/lib/server/api";

import {
  createProject,
  deleteProject,
  listProjects,
  projectDetail,
  renameProject,
} from "./projects";

let db: Db;
let me: string;
let other: string;

const status = (p: Promise<unknown>) =>
  p.then(
    () => 200,
    (e: unknown) => (e instanceof ApiError ? e.status : 500),
  );

beforeAll(async () => {
  db = await useTestDb();
  [{ id: me }, { id: other }] = await db
    .insert(users)
    .values([{ phone: "+8801700000001" }, { phone: "+8801700000002" }])
    .returning();
  await db.insert(chats).values([
    { id: "a", userId: me, title: "A", kind: "best" },
    { id: "b", userId: me, title: "B", kind: "compare" },
    { id: "c", userId: me, title: "C", kind: "image" },
    { id: "theirs", userId: other, title: "T", kind: "best" },
  ]);
});

describe("projects", () => {
  it("creates, lists with counts and keeps names unique per user ignoring case", async () => {
    const launch = await createProject(db, me, "MultiAI launch");
    expect(launch).toMatchObject({ name: "MultiAI launch", chatCount: 0 });
    expect(await status(createProject(db, me, "multiai LAUNCH"))).toBe(409);
    // Another user may use the same name.
    expect(await status(createProject(db, other, "MultiAI launch"))).toBe(200);

    await updateChat(db, me, "a", { projectId: launch.id });
    await updateChat(db, me, "b", { projectId: launch.id });
    const [listed] = await listProjects(db, me);
    expect(listed).toMatchObject({ id: launch.id, chatCount: 2 });
    expect((await listProjects(db, other)).map((p) => p.chatCount)).toEqual([
      0,
    ]);
  });

  it("is owner-only", async () => {
    const [mine] = await listProjects(db, me);
    expect(await status(projectDetail(db, other, mine.id))).toBe(404);
    expect(await status(renameProject(db, other, mine.id, "x"))).toBe(404);
    expect(await status(deleteProject(db, other, mine.id))).toBe(404);
    // Another user's project can't take my chat, and I can't move their chat.
    const [theirs] = await listProjects(db, other);
    expect(
      await status(updateChat(db, me, "c", { projectId: theirs.id })),
    ).toBe(404);
    expect(
      await status(updateChat(db, me, "theirs", { projectId: mine.id })),
    ).toBe(404);
  });

  it("lists a project's chats, moves chats between projects and out", async () => {
    const [launch] = await listProjects(db, me);
    const coffee = await createProject(db, me, "Coffee brand");
    let detail = await projectDetail(db, me, launch.id);
    expect(detail.chats.map((c) => c.id).sort()).toEqual(["a", "b"]);
    expect(detail.chats.every((c) => c.projectId === launch.id)).toBe(true);

    // A chat is in at most one project: moving it takes it out of the other.
    const moved = await updateChat(db, me, "b", { projectId: coffee.id });
    expect(moved.projectId).toBe(coffee.id);
    detail = await projectDetail(db, me, launch.id);
    expect(detail.chats.map((c) => c.id)).toEqual(["a"]);
    expect(detail.chatCount).toBe(1);

    // Unassign.
    expect((await updateChat(db, me, "b", { projectId: null })).projectId).toBe(
      null,
    );
    expect((await projectDetail(db, me, coffee.id)).chats).toEqual([]);
  });

  it("renames (still unique) and deletes without deleting chats", async () => {
    const [launch, coffee] = await listProjects(db, me);
    expect(
      await status(renameProject(db, me, coffee.id, "MULTIAI launch")),
    ).toBe(409);
    // Same name in another case for the project itself is fine.
    expect((await renameProject(db, me, launch.id, "Launch")).name).toBe(
      "Launch",
    );

    await deleteProject(db, me, launch.id);
    expect(await status(projectDetail(db, me, launch.id))).toBe(404);
    expect((await listProjects(db, me)).map((p) => p.id)).toEqual([coffee.id]);
    const all = await listChats(db, me);
    expect(all.map((c) => c.id).sort()).toEqual(["a", "b", "c"]);
    expect(all.every((c) => c.projectId === null)).toBe(true);
    // The name is free again once deleted.
    expect(await status(createProject(db, me, "Launch"))).toBe(200);
  });
});
