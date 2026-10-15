import { requireUser } from "@/lib/auth/session";
import { walletSummary } from "@/lib/billing/usage";
import { getDb } from "@/lib/db";
import { json, route } from "@/lib/server/api";

// Balance, plan, spending this month and the average per prompt, from the ledger.
export const GET = route(async () => {
  const user = await requireUser();
  return json(await walletSummary(await getDb(), user.id));
});
