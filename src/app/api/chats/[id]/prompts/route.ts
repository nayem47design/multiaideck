import { after } from "next/server";

import { sendPrompt } from "@/lib/ai/orchestrator";
import { requireUser } from "@/lib/auth/session";
import { credits } from "@/lib/billing/units";
import {
  SendPromptRequest,
  type SendPromptResponse,
} from "@/lib/contracts/chat";
import { getDb } from "@/lib/db";
import { json, readBody, route } from "@/lib/server/api";

/**
 * POST /api/chats/:id/prompts — a follow-up. `recipients` picks who gets it; models that missed
 * earlier prompts catch up first. 402 insufficient_credits creates nothing.
 */
export const POST = route(
  async (req: Request, ctx: RouteContext<"/api/chats/[id]/prompts">) => {
    const user = await requireUser();
    const { id } = await ctx.params;
    const body = await readBody(req, SendPromptRequest);
    const started = await sendPrompt(await getDb(), user.id, {
      chatId: id,
      text: body.text,
      mode: body.mode,
      models: body.models,
      attachments: body.attachments,
      recipients: body.recipients,
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
  },
);
