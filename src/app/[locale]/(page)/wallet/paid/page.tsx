import { setRequestLocale } from "next-intl/server";

import { MobilePaid } from "../_components/MobileScreens";

export default async function Page({
  params,
}: PageProps<"/[locale]/wallet/paid">) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <MobilePaid />;
}
