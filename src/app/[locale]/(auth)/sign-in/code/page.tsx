import { setRequestLocale } from "next-intl/server";

import { CodeScreen } from "../../_components/CodeScreen";

export default async function EnterCodePage({
  params,
}: PageProps<"/[locale]/sign-in/code">) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <CodeScreen />;
}
