import { setRequestLocale } from "next-intl/server";

import { LightField } from "@/components/atoms/LightField";

import { WalletDesktop } from "./_components/WalletDesktop";

// Wallet and payments. From 768px every wallet route shows the desktop Wallet frame (kept mounted
// across the sub-routes, which open its checkout dialogs); below 768px each route is its own
// M-screen (the page).
export default async function WalletLayout({
  children,
  params,
}: LayoutProps<"/[locale]/wallet">) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <>
      <LightField variant="wallet" />
      <WalletDesktop className="max-md:hidden" />
      <div className="md:hidden">{children}</div>
    </>
  );
}
