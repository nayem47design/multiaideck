import { z } from "zod";

import { ChatSummarySchema } from "./chat";
import { IsoDate } from "./common";

// Projects: folders of related chats. A chat is in at most one project.
//
// GET    /api/projects               → ProjectListResponse (with each project's chat count)
// POST   /api/projects               CreateProjectRequest → Project  (409 conflict: name taken)
// GET    /api/projects/:id           → ProjectDetail (the project and its chats, newest first)
// PATCH  /api/projects/:id           UpdateProjectRequest → Project  (409 conflict: name taken)
// DELETE /api/projects/:id           → 204 (soft delete; its chats move out, never deleted)
// PATCH  /api/chats/:id { projectId } moves a chat in (an id) or out (null).
//
// Names are trimmed, 1–60 characters, unique per user ignoring case.

export const PROJECT_NAME_MAX = 60;

export const ProjectName = z.string().trim().min(1).max(PROJECT_NAME_MAX);

export const ProjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  chatCount: z.number().int().nonnegative(),
  createdAt: IsoDate,
  updatedAt: IsoDate,
});
export type Project = z.infer<typeof ProjectSchema>;

export const ProjectListResponse = z.object({
  projects: z.array(ProjectSchema),
});
export type ProjectListResponse = z.infer<typeof ProjectListResponse>;

export const ProjectDetailSchema = ProjectSchema.extend({
  chats: z.array(ChatSummarySchema),
});
export type ProjectDetail = z.infer<typeof ProjectDetailSchema>;

export const CreateProjectRequest = z.object({ name: ProjectName });
export type CreateProjectRequest = z.input<typeof CreateProjectRequest>;

export const UpdateProjectRequest = z.object({ name: ProjectName });
export type UpdateProjectRequest = z.input<typeof UpdateProjectRequest>;
