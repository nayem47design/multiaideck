import "server-only";

import type { SessionUser } from "@/lib/auth/session";
import type { Db } from "@/lib/db";
import { ApiError } from "@/lib/server/api";

import { getPayment } from "./service";

/** The payment if it belongs to the user (or the user is an admin); 404 otherwise. */
export async function ownPayment(db: Db, user: SessionUser, id: string) {
  const payment = await getPayment(db, id);
  if (!payment || (payment.userId !== user.id && user.role !== "admin"))
    throw new ApiError(404, "not_found");
  return payment;
}
