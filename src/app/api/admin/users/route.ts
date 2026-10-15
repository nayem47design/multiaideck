import { z } from "zod";

import { requireAdmin } from "@/lib/auth/session";
import { searchUsers } from "@/lib/billing/admin";
import { getDb } from "@/lib/db";
import { json, readQuery, route } from "@/lib/server/api";

const Query = z.object({ q: z.string().max(100).default("") });

// Admins: find a user by phone, email or name (newest first, 50 at most).
export const GET = route(async (req: Request) => {
  await requireAdmin();
  const { q } = readQuery(req, Query);
  return json({ users: await searchUsers(await getDb(), q) });
});
