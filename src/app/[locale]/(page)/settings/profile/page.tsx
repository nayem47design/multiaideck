import { setRequestLocale } from "next-intl/server";

import { ProfileScreen } from "../_components/ProfileScreen";

export default async function ProfilePage({
  params,
}: PageProps<"/[locale]/settings/profile">) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <ProfileScreen />;
}
