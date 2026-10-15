import { z } from "zod";

import { meResponse } from "@/lib/auth/account";
import { createSession } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import {
  COFFEE_STAGES,
  fixtureChatId,
  seedFixture,
} from "@/lib/db/seed/fixtures";
import { json, readQuery, route } from "@/lib/server/api";
import { assertDev } from "@/lib/server/dev";

// Development only (404 in production): sign in as the screen-test fixture for one prototype
// stage of the coffee-shop chat. Answers with the chat's id so tests can open it.
//   POST /api/dev/sign-in-fixture?stage=prompt-2  →  { ..., chatId: "fx-prompt-2-coffee-shop-names" }
export const POST = route(async (req: Request) => {
  assertDev();
  const { stage } = readQuery(req, z.object({ stage: z.enum(COFFEE_STAGES) }));
  const db = await getDb();
  const user = await seedFixture(db, stage).catch(() => seedFixture(db, stage));
  await createSession(user.id, req.headers.get("user-agent"));
  return json({
    ...(await meResponse(db, user)),
    chatId: fixtureChatId(stage),
  });
});
