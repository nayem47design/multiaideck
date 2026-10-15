import { setRequestLocale } from "next-intl/server";

import { MobileWallet } from "./_components/MobileScreens";

export default async function Page({ params }: PageProps<"/[locale]/wallet">) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <MobileWallet />;
}
