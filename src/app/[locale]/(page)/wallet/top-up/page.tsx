import { setRequestLocale } from "next-intl/server";

import { MobileTopUp } from "../_components/MobileScreens";

export default async function Page({
  params,
}: PageProps<"/[locale]/wallet/top-up">) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <MobileTopUp />;
}
