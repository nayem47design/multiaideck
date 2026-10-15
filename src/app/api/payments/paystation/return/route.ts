import { NextResponse } from "next/server";

import { getDb } from "@/lib/db";
import { returnPath } from "@/lib/payments/return-path";
import { handleReturn } from "@/lib/payments/service";
import { route } from "@/lib/server/api";
import { env } from "@/lib/server/env";

// PayStation sends the browser here when the person finishes (or abandons) the checkout. The query
// string (status, trx_id…) is NOT trusted: it only names the invoice. We record it, re-check the
// payment with PayStation server to server, and redirect by what our database says afterwards:
// paid → /wallet/paid, failed or cancelled → /wallet/failed, still pending → /wallet/pay (which
// keeps polling). Reloading this URL is safe: crediting happens once (see service.ts settle()).
export const GET = route(async (req: Request) => {
  const db = await getDb();
  const payment = await handleReturn(db, new URL(req.url).searchParams);
  const path = await returnPath(db, req, payment);
  return NextResponse.redirect(new URL(path, env.APP_URL), 303);
});
