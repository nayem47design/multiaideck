// Cookie names and the sign-in redirect rule, shared by the proxy (no database), route handlers
// and the browser. Nothing secret lives here.

/** The session token (httpOnly). Its presence is only an optimistic hint; route handlers check it. */
export const SESSION_COOKIE = "mai_session";

/** Google sign-in: state, PKCE verifier and where to go next (httpOnly, 10 minutes). */
export const OAUTH_COOKIE = "mai_oauth";

/**
 * A safe in-app path to continue to after sign-in: relative, same origin, no locale prefix
 * required. Anything else (absolute URLs, //host, /\host, control characters) becomes "/".
 */
export function safeNext(value: string | null | undefined): string {
  if (!value || typeof value !== "string") return "/";
  if (!value.startsWith("/") || value.startsWith("//")) return "/";
  if (/[\\\u0000-\u001f]/.test(value)) return "/";
  try {
    // Must stay on our origin after URL parsing too.
    const url = new URL(value, "http://x.invalid");
    if (url.origin !== "http://x.invalid") return "/";
    const path = url.pathname + url.search + url.hash;
    // Never bounce back into sign-in.
    if (/^\/(bn\/|en\/)?sign-in(\/|\?|$)/.test(path)) return "/";
    return path;
  } catch {
    return "/";
  }
}
