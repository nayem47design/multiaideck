import { setRequestLocale } from "next-intl/server";

import { AccountHome } from "./_components/AccountHome";
import { ProfileScreen } from "./_components/ProfileScreen";

// /settings: on phones the Account tab (M15 · Account & settings); from 768px the Profile page.
// Both are rendered and switched with CSS, so there is no viewport-dependent redirect.
export default async function SettingsPage({
  params,
}: PageProps<"/[locale]/settings">) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <>
      <AccountHome className="md:hidden" />
      <ProfileScreen className="max-md:hidden" />
    </>
  );
}
