import { getDb } from "@/lib/db";
import { seedDemo } from "@/lib/db/seed";
import { json, route } from "@/lib/server/api";
import { assertDev } from "@/lib/server/dev";

// Development only: load the prototype's demo data (idempotent).
export const POST = route(async () => {
  assertDev();
  const user = await seedDemo(await getDb());
  return json({ userId: user.id, phone: user.phone });
});
