import { defineRouting } from "next-intl/routing";

import { defaultLocale, locales } from "./config";

// English has no prefix (/wallet); Bangla is served under /bn (/bn/wallet). URL-based locales keep
// every route prerenderable with cacheComponents, unlike a cookie read on each request.
export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: "as-needed",
});
