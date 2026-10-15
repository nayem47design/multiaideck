import { after } from "next/server";

import { retryAnswer } from "@/lib/ai/orchestrator";
import { requireUser } from "@/lib/auth/session";
import { credits } from "@/lib/billing/units";
import type { SendPromptResponse } from "@/lib/contracts/chat";
import { getDb } from "@/lib/db";
import { json, route } from "@/lib/server/api";

/** POST /api/answers/:id/retry — asks the same model again (a new answer, retryOf = :id). */
export const POST = route(
  async (_req: Request, ctx: RouteContext<"/api/answers/[id]/retry">) => {
    const user = await requireUser();
    const { id } = await ctx.params;
    const started = await retryAnswer(await getDb(), user.id, id);
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
