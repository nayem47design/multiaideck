import { requireUser } from "@/lib/auth/session";
import {
  CreatePaymentRequest,
  type CreatePaymentResponse,
} from "@/lib/contracts/wallet";
import { getDb } from "@/lib/db";
import { createPayment, listPayments, toPayment } from "@/lib/payments/service";
import { json, readBody, route } from "@/lib/server/api";

// GET: the user's payments, newest first. POST: start a top-up or Pro payment. Credits are
// computed on the server from the pack (or custom amount); nothing is credited here.
export const GET = route(async () => {
  const user = await requireUser();
  const rows = await listPayments(await getDb(), user.id);
  return json({ payments: rows.map(toPayment) });
});

export const POST = route(async (req: Request) => {
  const user = await requireUser();
  const body = await readBody(req, CreatePaymentRequest);
  const { payment, redirectUrl } = await createPayment(
    await getDb(),
    user,
    body,
  );
  const res: CreatePaymentResponse = {
    payment: toPayment(payment),
    redirectUrl,
  };
  return json(res, { status: 201 });
});
