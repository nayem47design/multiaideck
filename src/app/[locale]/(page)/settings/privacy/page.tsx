import { setRequestLocale } from "next-intl/server";

import { PrivacyScreen } from "../_components/PrivacyScreen";

export default async function PrivacyPage({
  params,
}: PageProps<"/[locale]/settings/privacy">) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <PrivacyScreen />;
}
