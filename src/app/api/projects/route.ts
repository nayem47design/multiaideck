import { requireUser } from "@/lib/auth/session";
import {
  CreateProjectRequest,
  type Project,
  type ProjectListResponse,
} from "@/lib/contracts/projects";
import { getDb } from "@/lib/db";
import { json, readBody, route } from "@/lib/server/api";
import { createProject, listProjects } from "@/lib/server/projects";

/** GET /api/projects — the user's projects with their chat counts. */
export const GET = route(async () => {
  const user = await requireUser();
  const projects = await listProjects(await getDb(), user.id);
  return json<ProjectListResponse>({ projects });
});

/** POST /api/projects — a new, empty project (409 conflict when the name is taken). */
export const POST = route(async (req: Request) => {
  const user = await requireUser();
  const { name } = await readBody(req, CreateProjectRequest);
  return json<Project>(await createProject(await getDb(), user.id, name), {
    status: 201,
  });
});
