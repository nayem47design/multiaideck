import { getRequestConfig } from "next-intl/server";

import { defaultLocale } from "./config";

// Locale selection (URL prefix or cookie) is decided when routes are built in Phase 5.
export default getRequestConfig(async () => {
  const locale = defaultLocale;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
