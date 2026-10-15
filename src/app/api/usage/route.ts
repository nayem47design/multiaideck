import { z } from "zod";

import { requireUser } from "@/lib/auth/session";
import { usageReport } from "@/lib/billing/usage";
import { UsagePeriod } from "@/lib/contracts/account";
import { getDb } from "@/lib/db";
import { json, readQuery, route } from "@/lib/server/api";

const Query = z.object({ period: UsagePeriod.default("this-month") });

// Spending for a month: totals, by model, per day and per prompt, from the ledger.
export const GET = route(async (req: Request) => {
  const user = await requireUser();
  const { period } = readQuery(req, Query);
  return json(await usageReport(await getDb(), user.id, period));
});
