import { z } from "zod";

import { requireAdmin } from "@/lib/auth/session";
import { reconcile } from "@/lib/billing/reconcile";
import { getDb } from "@/lib/db";
import { json, readQuery, route } from "@/lib/server/api";

const Query = z.object({
  from: z.iso.datetime({ offset: true }).optional(),
  to: z.iso.datetime({ offset: true }).optional(),
});

// Admins: ledger check — paid payments vs ledger topup/bonus/pro_grant entries, with mismatches.
export const GET = route(async (req: Request) => {
  await requireAdmin();
  const { from, to } = readQuery(req, Query);
  return json(
    await reconcile(await getDb(), {
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    }),
  );
});
