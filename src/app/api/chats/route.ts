import { after } from "next/server";
import { z } from "zod";

import { listChats } from "@/lib/ai/chats";
import { sendPrompt } from "@/lib/ai/orchestrator";
import { requireUser } from "@/lib/auth/session";
import { credits } from "@/lib/billing/units";
import {
  SendPromptRequest,
  type ChatListResponse,
  type SendPromptResponse,
} from "@/lib/contracts/chat";
import { getDb } from "@/lib/db";
import { json, readBody, readQuery, route } from "@/lib/server/api";

const ListQuery = z.object({
  q: z.string().max(200).optional(),
  kind: z.enum(["best", "compare", "image"]).optional(),
});

/** GET /api/chats?q=&kind= — the user's chats, newest first; q searches titles and prompts. */
export const GET = route(async (req: Request) => {
  const user = await requireUser();
  const query = readQuery(req, ListQuery);
  const chats = await listChats(await getDb(), user.id, query);
  return json<ChatListResponse>({ chats });
});

/** POST /api/chats — a new chat with its first prompt; the answers run after the response. */
export const POST = route(async (req: Request) => {
  const user = await requireUser();
  const body = await readBody(req, SendPromptRequest);
  const started = await sendPrompt(await getDb(), user.id, {
    text: body.text,
    mode: body.mode,
    models: body.models,
    attachments: body.attachments,
  });
  after(() => started.job);
  return json<SendPromptResponse>(
    {
      chatId: started.chatId,
      promptId: started.promptId,
      reservedCredits: credits(started.reservedMcr),
    },
    { status: 201 },
  );
});
