import { setRequestLocale } from "next-intl/server";

import { HelpScreen } from "../_components/HelpScreen";

export default async function HelpPage({
  params,
}: PageProps<"/[locale]/settings/help">) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <HelpScreen />;
}
