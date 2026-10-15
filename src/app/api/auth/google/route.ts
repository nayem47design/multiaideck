import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { OAUTH_COOKIE, safeNext } from "@/lib/auth/cookies";
import {
  OAUTH_MAX_AGE,
  assertGoogle,
  authorizeUrl,
  newOAuthState,
} from "@/lib/auth/google";
import { route } from "@/lib/server/api";
import { env } from "@/lib/server/env";

// GET /api/auth/google?next=/path&locale=bn — start Google sign-in (state + PKCE in a cookie).
// GET /api/auth/google?check=1 — 204 when Google sign-in is set up, else 503 not_configured.
export const GET = route(async (req: Request) => {
  assertGoogle();
  const params = new URL(req.url).searchParams;
  if (params.has("check")) return new Response(null, { status: 204 });

  const state = newOAuthState(
    safeNext(params.get("next")),
    params.get("locale") === "bn" ? "bn" : "en",
  );
  (await cookies()).set(OAUTH_COOKIE, JSON.stringify(state), {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/auth/google",
    maxAge: OAUTH_MAX_AGE,
  });
  return NextResponse.redirect(authorizeUrl(state));
});
