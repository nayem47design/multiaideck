import { eq } from "drizzle-orm";

import { meResponse, softDeleteUser } from "@/lib/auth/account";
import {
  clearSessionCookie,
  getSessionUser,
  requireUser,
} from "@/lib/auth/session";
import {
  DeleteAccountRequest,
  UpdateProfileRequest,
} from "@/lib/contracts/account";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { ApiError, json, readBody, route } from "@/lib/server/api";

// GET    /api/me  → MeResponse (401 when signed out; a stale cookie is cleared)
// PATCH  /api/me  UpdateProfileRequest → MeResponse
// DELETE /api/me  { confirm: "DELETE" } → 204 (soft delete, signs out everywhere; ledger untouched)

export const GET = route(async () => {
  const user = await getSessionUser();
  if (!user) {
    await clearSessionCookie();
    throw new ApiError(401, "unauthorized", "Sign in first");
  }
  return json(await meResponse(await getDb(), user));
});

export const PATCH = route(async (req: Request) => {
  const user = await requireUser();
  const input = await readBody(req, UpdateProfileRequest);
  const db = await getDb();
  const [updated] = await db
    .update(users)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(users.id, user.id))
    .returning();
  return json(await meResponse(db, updated));
});

export const DELETE = route(async (req: Request) => {
  const user = await requireUser();
  await readBody(req, DeleteAccountRequest);
  await softDeleteUser(await getDb(), user.id);
  await clearSessionCookie();
  return new Response(null, { status: 204 });
});
