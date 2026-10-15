import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { googleAccount } from "@/lib/auth/account";
import { OAUTH_COOKIE, safeNext } from "@/lib/auth/cookies";
import {
  assertGoogle,
  fetchGoogleProfile,
  stateMatches,
  type OAuthState,
} from "@/lib/auth/google";
import { createSession, getSessionUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { ApiError } from "@/lib/server/api";
import { env } from "@/lib/server/env";

// GET /api/auth/google/callback — Google sends the user back here. Check state, exchange the code
// (with the PKCE verifier), read the profile, then sign in, create the account, or link Google to
// the signed-in user. Failures go back to sign-in with ?error=google… (the screen explains).

function readState(raw: string | undefined): OAuthState | null {
  try {
    const s = JSON.parse(raw ?? "") as OAuthState;
    return typeof s.state === "string" && typeof s.verifier === "string"
      ? s
      : null;
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  const jar = await cookies();
  const saved = readState(jar.get(OAUTH_COOKIE)?.value);
  // One use only.
  jar.set(OAUTH_COOKIE, "", { path: "/api/auth/google", maxAge: 0 });

  const prefix = saved?.locale === "bn" ? "/bn" : "";
  const to = (path: string) =>
    NextResponse.redirect(new URL(prefix + path, env.APP_URL));
  const fail = (error: string) => to(`/sign-in?error=${error}`);

  const params = new URL(req.url).searchParams;
  try {
    assertGoogle();
    if (!saved || !stateMatches(saved.state, params.get("state")))
      return fail("google");
    const code = params.get("code");
    if (params.get("error") || !code) return fail("google_cancelled");

    const profile = await fetchGoogleProfile(code, saved.verifier);
    const db = await getDb();
    const current = await getSessionUser();
    const { user } = await googleAccount(db, profile, current, saved.locale);
    if (!current) await createSession(user.id, req.headers.get("user-agent"));
    return to(safeNext(saved.next));
  } catch (e) {
    if (e instanceof ApiError && e.code === "not_configured")
      return fail("google_not_configured");
    if (e instanceof ApiError && e.code === "conflict")
      return to("/settings/privacy?error=google_in_use");
    console.error("Google sign-in failed", e);
    return fail("google");
  }
}
