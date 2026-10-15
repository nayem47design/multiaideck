import { requireAdmin } from "@/lib/auth/session";
import { refundUser } from "@/lib/billing/admin";
import { AdminRefundRequest } from "@/lib/contracts/account";
import { getDb } from "@/lib/db";
import { json, readBody, route } from "@/lib/server/api";

// Admins: manual refund with a reason. Appends a "refund" ledger entry (createdBy = the admin) and
// an admin_actions row. Send an Idempotency-Key header per refund form so a retry is a no-op.
export const POST = route(
  async (req: Request, ctx: RouteContext<"/api/admin/users/[id]/refund">) => {
    const admin = await requireAdmin();
    const body = await readBody(req, AdminRefundRequest);
    const key =
      req.headers.get("idempotency-key")?.slice(0, 100) || crypto.randomUUID();
    return json(
      await refundUser(await getDb(), {
        adminId: admin.id,
        userId: (await ctx.params).id,
        credits: body.credits,
        reason: body.reason,
        key,
      }),
    );
  },
);
