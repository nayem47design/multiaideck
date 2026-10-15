import "server-only";

import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

import { ApiError } from "@/lib/server/api";
import { env, has } from "@/lib/server/env";

import type { GoogleProfile } from "./account";

// Google sign-in: OAuth 2.0 authorization code flow with PKCE (S256) and a random state, both
// kept in a short-lived httpOnly cookie (OAUTH_COOKIE) scoped to /api/auth/google. The profile
// comes from Google's OpenID userinfo endpoint with the access token we just exchanged, so it is
// verified by Google over TLS (no ID-token parsing needed).

const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";

export const OAUTH_MAX_AGE = 10 * 60;

export interface OAuthState {
  state: string;
  verifier: string;
  next: string;
  locale: "en" | "bn";
}

export function assertGoogle() {
  if (!has.google())
    throw new ApiError(503, "not_configured", "Google sign-in is not set up");
}

export const redirectUri = () =>
  new URL("/api/auth/google/callback", env.APP_URL).toString();

export function newOAuthState(next: string, locale: "en" | "bn"): OAuthState {
  return {
    state: randomBytes(24).toString("base64url"),
    verifier: randomBytes(48).toString("base64url"),
    next,
    locale,
  };
}

export function authorizeUrl(s: OAuthState) {
  const challenge = createHash("sha256").update(s.verifier).digest("base64url");
  const url = new URL(AUTH_URL);
  url.search = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID!,
    redirect_uri: redirectUri(),
    response_type: "code",
    scope: "openid email profile",
    state: s.state,
    code_challenge: challenge,
    code_challenge_method: "S256",
    prompt: "select_account",
  }).toString();
  return url.toString();
}

export function stateMatches(expected: string, got: string | null) {
  if (!got) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(got);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Exchange the code for tokens, then read the profile. */
export async function fetchGoogleProfile(
  code: string,
  verifier: string,
): Promise<GoogleProfile> {
  const tokenRes = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID!,
      client_secret: env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirectUri(),
      grant_type: "authorization_code",
      code_verifier: verifier,
    }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!tokenRes.ok) throw new Error(`Google token ${tokenRes.status}`);
  const { access_token } = (await tokenRes.json()) as { access_token?: string };
  if (!access_token) throw new Error("Google token: no access_token");

  const infoRes = await fetch(USERINFO_URL, {
    headers: { authorization: `Bearer ${access_token}` },
    signal: AbortSignal.timeout(10_000),
  });
  if (!infoRes.ok) throw new Error(`Google userinfo ${infoRes.status}`);
  const info = (await infoRes.json()) as {
    sub?: string;
    email?: string;
    email_verified?: boolean | string;
    name?: string;
  };
  if (!info.sub) throw new Error("Google userinfo: no sub");
  return {
    sub: info.sub,
    email: info.email,
    emailVerified:
      info.email_verified === true || info.email_verified === "true",
    name: info.name?.slice(0, 80),
  };
}
