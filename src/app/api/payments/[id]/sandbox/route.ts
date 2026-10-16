import { requireUser } from "@/lib/auth/session";
import { SandboxDecision } from "@/lib/contracts/wallet";
import { getDb } from "@/lib/db";
import { ownPayment } from "@/lib/payments/access";
import { decideSandbox, toPayment } from "@/lib/payments/service";
import { ApiError, json, readBody, route } from "@/lib/server/api";
import { demoMode, env } from "@/lib/server/env";

// The in-app sandbox checkout decides a sandbox payment: paid, failed or cancelled. Never in
// production (except a demo deployment, which has no PayStation keys), and never for a
// PayStation payment.
export const POST = route(
  async (req: Request, ctx: RouteContext<"/api/payments/[id]/sandbox">) => {
    if (env.NODE_ENV === "production" && !demoMode())
      throw new ApiError(404, "not_found");
    const user = await requireUser();
    const { outcome } = await readBody(req, SandboxDecision);
    const db = await getDb();
    const payment = await ownPayment(db, user, (await ctx.params).id);
    return json(toPayment(await decideSandbox(db, payment, outcome)));
  },
);
