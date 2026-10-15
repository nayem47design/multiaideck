// @vitest-environment node
import { eq } from "drizzle-orm";
import { beforeAll, describe, expect, it, vi } from "vitest";

import type { Db } from "@/lib/db";
import { adminActions, ledgerEntries, users } from "@/lib/db/schema";
import { useTestDb } from "@/lib/db/testing";

// A cookie jar for the real session code (requireUser / requireAdmin).
const jar = new Map<string, string>();
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      jar.has(name) ? { name, value: jar.get(name)! } : undefined,
    set: (name: string, value: string) => jar.set(name, value),
    delete: (name: string) => jar.delete(name),
  }),
}));

const { createSession } = await import("@/lib/auth/session");
const { POST: refund } =
  await import("@/app/api/admin/users/[id]/refund/route");
const { GET: search } = await import("@/app/api/admin/users/route");
const { balanceMcr } = await import("./ledger");

let db: Db;
let admin: typeof users.$inferSelect;
let customer: typeof users.$inferSelect;

beforeAll(async () => {
  db = await useTestDb();
  [admin] = await db
    .insert(users)
    .values({ phone: "+8801700000009", name: "Support", role: "admin" })
    .returning();
  [customer] = await db
    .insert(users)
    .values({ phone: "+8801712345214", name: "Customer" })
    .returning();
});

async function signInAs(userId: string) {
  jar.clear();
  await createSession(userId);
}

function refundRequest(body: unknown, key = "k1") {
  return refund(
    new Request(`http://test/api/admin/users/${customer.id}/refund`, {
      method: "POST",
      headers: { "content-type": "application/json", "idempotency-key": key },
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ id: customer.id }) },
  );
}

describe("admin refund", () => {
  it("is refused for signed-out people and non-admins", async () => {
    jar.clear();
    expect(
      (await refundRequest({ credits: 10, reason: "Failed answer" })).status,
    ).toBe(401);
    await signInAs(customer.id);
    expect(
      (await refundRequest({ credits: 10, reason: "Failed answer" })).status,
    ).toBe(403);
    expect(await balanceMcr(db, customer.id)).toBe(0);
  });

  it("appends a refund entry and an admin action, once per key", async () => {
    await signInAs(admin.id);
    const body = { credits: 12.5, reason: "Answer failed but was charged" };
    const res = await refundRequest(body);
    expect(res.status).toBe(200);
    await refundRequest(body); // retried: no-op
    const detail = await (await refundRequest(body)).json();
    expect(detail.user.balanceCredits).toBe(12.5);

    const entries = await db
      .select()
      .from(ledgerEntries)
      .where(eq(ledgerEntries.userId, customer.id));
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      kind: "refund",
      amountMcr: 12_500,
      createdBy: admin.id,
      note: body.reason,
    });
    const actions = await db.select().from(adminActions);
    expect(actions).toHaveLength(1);
    expect(actions[0]).toMatchObject({
      adminId: admin.id,
      targetUserId: customer.id,
      action: "refund",
    });

    // A new key is a new refund.
    await refundRequest(body, "k2");
    expect(await balanceMcr(db, customer.id)).toBe(25_000);
  });

  it("rejects a refund without a reason", async () => {
    await signInAs(admin.id);
    expect((await refundRequest({ credits: 5, reason: "" })).status).toBe(400);
  });

  it("finds users by local phone format, email or name", async () => {
    await signInAs(admin.id);
    const find = async (q: string) =>
      (
        await (
          await search(
            new Request(
              `http://test/api/admin/users?q=${encodeURIComponent(q)}`,
            ),
          )
        ).json()
      ).users.map((u: { id: string }) => u.id);
    expect(await find("01712345214")).toEqual([customer.id]);
    expect(await find("custom")).toEqual([customer.id]);
  });
});
