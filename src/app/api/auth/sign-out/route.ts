import { destroySession } from "@/lib/auth/session";
import { route } from "@/lib/server/api";

// POST /api/auth/sign-out — end this session and clear the cookie.
export const POST = route(async () => {
  await destroySession();
  return new Response(null, { status: 204 });
});
