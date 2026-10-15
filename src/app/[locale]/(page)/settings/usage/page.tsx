import { setRequestLocale } from "next-intl/server";

import { UsageScreen } from "../_components/UsageScreen";

export default async function UsagePage({
  params,
}: PageProps<"/[locale]/settings/usage">) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <UsageScreen />;
}
