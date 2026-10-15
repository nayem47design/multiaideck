import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";

import { SESSION_COOKIE, safeNext } from "./lib/auth/cookies";
import { routing } from "./lib/i18n/routing";

// Locale routing (next-intl) plus an optimistic sign-in check: an app page without a session
// cookie goes to the locale's /sign-in?next=<path>, and someone with a cookie who opens /sign-in
// goes home. This only looks at the cookie; route handlers check the session for real
// (requireUser), and GET /api/me clears a stale cookie so nobody gets stuck in a loop.

const intl = createMiddleware(routing);

const PREFIXED = routing.locales.filter((l) => l !== routing.defaultLocale);

function split(pathname: string) {
  for (const l of PREFIXED)
    if (pathname === `/${l}` || pathname.startsWith(`/${l}/`))
      return { prefix: `/${l}`, rest: pathname.slice(l.length + 1) || "/" };
  return { prefix: "", rest: pathname };
}

export default function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  // /en/… is redirected to /… by next-intl first; check on the next request.
  if (pathname === "/en" || pathname.startsWith("/en/")) return intl(req);

  const { prefix, rest } = split(pathname);
  const onSignIn = rest === "/sign-in" || rest.startsWith("/sign-in/");
  const signedIn = req.cookies.has(SESSION_COOKIE);

  if (!signedIn && !onSignIn) {
    const url = req.nextUrl.clone();
    url.pathname = `${prefix}/sign-in`;
    url.search = "";
    const next = safeNext(rest + search);
    if (next !== "/") url.searchParams.set("next", next);
    return NextResponse.redirect(url);
  }
  if (signedIn && onSignIn) {
    const url = req.nextUrl.clone();
    url.pathname = prefix || "/";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return intl(req);
}

export const config = {
  // Everything except API routes, Next internals and files with an extension.
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
