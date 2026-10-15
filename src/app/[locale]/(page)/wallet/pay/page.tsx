import { setRequestLocale } from "next-intl/server";

import { MobilePay } from "../_components/MobileScreens";

export default async function Page({
  params,
}: PageProps<"/[locale]/wallet/pay">) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <MobilePay />;
}
