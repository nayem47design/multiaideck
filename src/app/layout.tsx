import { NextIntlClientProvider } from "next-intl";
import { getLocale } from "next-intl/server";

import { fontVariables } from "./fonts";
import "./globals.css";

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getLocale();

  return (
    <html lang={locale} className={fontVariables}>
      <body>
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
