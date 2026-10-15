import { chatDetail, deleteChat, updateChat } from "@/lib/ai/chats";
import { requireUser } from "@/lib/auth/session";
import {
  UpdateChatRequest,
  type ChatDetail,
  type ChatSummary,
} from "@/lib/contracts/chat";
import { getDb } from "@/lib/db";
import { json, readBody, route } from "@/lib/server/api";

type Ctx = RouteContext<"/api/chats/[id]">;

/** GET /api/chats/:id — the chat with every prompt, answer and Best answer. */
export const GET = route(async (_req: Request, ctx: Ctx) => {
  const user = await requireUser();
  const { id } = await ctx.params;
  return json<ChatDetail>(await chatDetail(await getDb(), user.id, id));
});

/** PATCH /api/chats/:id — rename, pin, or move into a project (projectId) or out of it (null). */
export const PATCH = route(async (req: Request, ctx: Ctx) => {
  const user = await requireUser();
  const { id } = await ctx.params;
  const body = await readBody(req, UpdateChatRequest);
  return json<ChatSummary>(await updateChat(await getDb(), user.id, id, body));
});

/** DELETE /api/chats/:id — soft delete (charges stay in the ledger and usage). */
export const DELETE = route(async (_req: Request, ctx: Ctx) => {
  const user = await requireUser();
  const { id } = await ctx.params;
  await deleteChat(await getDb(), user.id, id);
  return new Response(null, { status: 204 });
});
