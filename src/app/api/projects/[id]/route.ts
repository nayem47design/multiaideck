import { requireUser } from "@/lib/auth/session";
import {
  UpdateProjectRequest,
  type Project,
  type ProjectDetail,
} from "@/lib/contracts/projects";
import { getDb } from "@/lib/db";
import { json, readBody, route } from "@/lib/server/api";
import {
  deleteProject,
  projectDetail,
  renameProject,
} from "@/lib/server/projects";

type Ctx = RouteContext<"/api/projects/[id]">;

/** GET /api/projects/:id — the project and its chats, newest first. */
export const GET = route(async (_req: Request, ctx: Ctx) => {
  const user = await requireUser();
  const { id } = await ctx.params;
  return json<ProjectDetail>(await projectDetail(await getDb(), user.id, id));
});

/** PATCH /api/projects/:id — rename (409 conflict when the name is taken). */
export const PATCH = route(async (req: Request, ctx: Ctx) => {
  const user = await requireUser();
  const { id } = await ctx.params;
  const { name } = await readBody(req, UpdateProjectRequest);
  return json<Project>(await renameProject(await getDb(), user.id, id, name));
});

/** DELETE /api/projects/:id — soft delete; its chats move out of it and stay. */
export const DELETE = route(async (_req: Request, ctx: Ctx) => {
  const user = await requireUser();
  const { id } = await ctx.params;
  await deleteProject(await getDb(), user.id, id);
  return new Response(null, { status: 204 });
});
