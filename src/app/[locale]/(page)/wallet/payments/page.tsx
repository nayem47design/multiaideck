import { setRequestLocale } from "next-intl/server";

import { MobilePayments } from "../_components/MobileScreens";

export default async function Page({
  params,
}: PageProps<"/[locale]/wallet/payments">) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <MobilePayments />;
}
