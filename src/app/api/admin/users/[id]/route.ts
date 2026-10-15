import { requireAdmin } from "@/lib/auth/session";
import { userDetail } from "@/lib/billing/admin";
import { getDb } from "@/lib/db";
import { json, route } from "@/lib/server/api";

// Admins: one user with their ledger (newest 200 entries) and payments.
export const GET = route(
  async (_req: Request, ctx: RouteContext<"/api/admin/users/[id]">) => {
    await requireAdmin();
    return json(await userDetail(await getDb(), (await ctx.params).id));
  },
);
