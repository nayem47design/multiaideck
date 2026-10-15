import "server-only";

import { desc, eq, ilike, isNull, and, or } from "drizzle-orm";

import type { Db } from "@/lib/db";
import { adminActions, ledgerEntries, users } from "@/lib/db/schema";
import { toPayment, listPayments } from "@/lib/payments/service";
import { ApiError } from "@/lib/server/api";
import { toUser } from "@/lib/server/users";

import { appendEntry, balanceMcr } from "./ledger";
import { credits, mcr } from "./units";

// Support tools (BUILD_GUIDE Phase 6 step 8): look up a user, see their ledger and payments, and
// issue a manual refund with a reason. A refund is a new "refund" ledger entry (rule 8) with the
// admin as createdBy, plus an admin_actions row, in one transaction.

type UserRow = typeof users.$inferSelect;

async function adminUser(db: Db, u: UserRow) {
  return { ...toUser(u), balanceCredits: credits(await balanceMcr(db, u.id)) };
}

export async function searchUsers(db: Db, q: string) {
  const term = q.trim();
  const digits = term.replace(/\D/g, "");
  const like = `%${term.replace(/[%_\\]/g, (c) => `\\${c}`)}%`;
  const rows = await db
    .select()
    .from(users)
    .where(
      and(
        isNull(users.deletedAt),
        term
          ? or(
              ilike(users.name, like),
              ilike(users.email, like),
              ilike(users.phone, like),
              // Local formats: 01712…, 1712 345 214.
              digits.length >= 4
                ? ilike(users.phone, `%${digits.replace(/^0/, "")}%`)
                : undefined,
            )
          : undefined,
      ),
    )
    .orderBy(desc(users.createdAt))
    .limit(50);
  return Promise.all(rows.map((u) => adminUser(db, u)));
}

export async function userDetail(db: Db, userId: string) {
  const [u] = await db.select().from(users).where(eq(users.id, userId));
  if (!u) throw new ApiError(404, "not_found");
  const ledger = await db
    .select()
    .from(ledgerEntries)
    .where(eq(ledgerEntries.userId, userId))
    .orderBy(desc(ledgerEntries.id))
    .limit(200);
  const pays = await listPayments(db, userId, 100);
  return {
    user: await adminUser(db, u),
    ledger: ledger.map((e) => ({
      id: e.id,
      kind: e.kind,
      credits: credits(e.amountMcr),
      refType: e.refType,
      refId: e.refId,
      note: e.note,
      createdBy: e.createdBy,
      createdAt: e.createdAt.toISOString(),
    })),
    payments: pays.map(toPayment),
  };
}

/**
 * Manual refund. `key` makes a retried request (double click, network retry) a no-op: the client
 * sends one key per refund form.
 */
export async function refundUser(
  db: Db,
  {
    adminId,
    userId,
    credits: amount,
    reason,
    key,
  }: {
    adminId: string;
    userId: string;
    credits: number;
    reason: string;
    key: string;
  },
) {
  const [u] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, userId));
  if (!u) throw new ApiError(404, "not_found");
  const amountMcr = mcr(amount);
  if (amountMcr <= 0) throw new ApiError(400, "invalid_input");
  await db.transaction(async (tx) => {
    const added = await appendEntry(tx, {
      userId,
      kind: "refund",
      amountMcr,
      idempotencyKey: `refund:admin:${userId}:${key}`,
      refType: "admin",
      refId: adminId,
      note: reason,
      createdBy: adminId,
    });
    if (added)
      await tx.insert(adminActions).values({
        adminId,
        action: "refund",
        targetUserId: userId,
        reason,
        payload: { credits: amount, key },
      });
  });
  return userDetail(db, userId);
}
