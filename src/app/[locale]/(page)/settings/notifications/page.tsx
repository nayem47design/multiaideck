import { setRequestLocale } from "next-intl/server";

import { NotificationsScreen } from "../_components/NotificationsScreen";

export default async function NotificationsPage({
  params,
}: PageProps<"/[locale]/settings/notifications">) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <NotificationsScreen />;
}
