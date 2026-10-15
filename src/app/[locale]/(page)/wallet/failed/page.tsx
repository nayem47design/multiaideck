import { setRequestLocale } from "next-intl/server";

import { MobileFailed } from "../_components/MobileScreens";

export default async function Page({
  params,
}: PageProps<"/[locale]/wallet/failed">) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <MobileFailed />;
}
