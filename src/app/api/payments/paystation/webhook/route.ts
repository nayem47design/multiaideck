import { after } from "next/server";

import { getDb } from "@/lib/db";
import { handleWebhook } from "@/lib/payments/service";

// PayStation IPN. The body is recorded verbatim and only used to find the invoice; the payment is
// then verified with a server-to-server status check (never from the body). Always answers 200
// quickly so PayStation doesn't retry forever; the check runs after the response. Repeats are
// harmless: crediting happens once (see service.ts settle()).
export async function POST(req: Request) {
  let body: Record<string, unknown> = {};
  try {
    const text = await req.text();
    const type = req.headers.get("content-type") ?? "";
    body = type.includes("json")
      ? (JSON.parse(text) as Record<string, unknown>)
      : Object.fromEntries(new URLSearchParams(text));
  } catch {
    body = {};
  }

  after(async () => {
    try {
      await handleWebhook(await getDb(), body);
    } catch (e) {
      console.error("PayStation webhook:", (e as Error).message);
    }
  });

  return new Response(null, { status: 200 });
}
