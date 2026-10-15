import { after } from "next/server";

import { swapAnswer } from "@/lib/ai/orchestrator";
import { requireUser } from "@/lib/auth/session";
import { credits } from "@/lib/billing/units";
import {
  SwapModelRequest,
  type SendPromptResponse,
} from "@/lib/contracts/chat";
import { getDb } from "@/lib/db";
import { json, readBody, route } from "@/lib/server/api";

/** POST /api/answers/:id/swap — asks a different model the same prompt, in :id's place. */
export const POST = route(
  async (req: Request, ctx: RouteContext<"/api/answers/[id]/swap">) => {
    const user = await requireUser();
    const { id } = await ctx.params;
    const { model } = await readBody(req, SwapModelRequest);
    const started = await swapAnswer(await getDb(), user.id, id, model);
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
