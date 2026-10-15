import { requireUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { ownPayment } from "@/lib/payments/access";
import { refreshPayment, toPayment } from "@/lib/payments/service";
import { json, route } from "@/lib/server/api";

// One payment. A pending PayStation payment is re-checked with PayStation first, so the pay
// screen can poll this until it settles.
export const GET = route(
  async (_req: Request, ctx: RouteContext<"/api/payments/[id]">) => {
    const user = await requireUser();
    const db = await getDb();
    let payment = await ownPayment(db, user, (await ctx.params).id);
    if (payment.status === "pending" && payment.provider === "paystation")
      payment = await refreshPayment(db, payment);
    return json(toPayment(payment));
  },
);
