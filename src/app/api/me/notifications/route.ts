import { getNotificationPrefs, setNotificationPrefs } from "@/lib/auth/account";
import { requireUser } from "@/lib/auth/session";
import { NotificationPrefs } from "@/lib/contracts/account";
import { getDb } from "@/lib/db";
import { json, readBody, route } from "@/lib/server/api";

// GET /api/me/notifications → NotificationPrefs; PUT the same shape (partial prefs are fine).
// Payment receipts stay on whatever is sent.

export const GET = route(async () => {
  const user = await requireUser();
  return json(await getNotificationPrefs(await getDb(), user));
});

export const PUT = route(async (req: Request) => {
  const user = await requireUser();
  const input = await readBody(req, NotificationPrefs);
  return json(await setNotificationPrefs(await getDb(), user, input));
});
