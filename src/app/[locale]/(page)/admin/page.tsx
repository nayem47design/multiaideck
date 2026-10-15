import { setRequestLocale } from "next-intl/server";

import { LightField } from "@/components/atoms/LightField";

import { AdminScreen } from "./_components/AdminScreen";

// Support tools (BUILD_GUIDE Phase 6 step 8): find a user, see their ledger and payments, refund
// credits with a reason, and run the ledger check. Admins only (the API answers 403 otherwise).
export default async function Page({ params }: PageProps<"/[locale]/admin">) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <>
      <LightField variant="wallet" />
      <AdminScreen />
    </>
  );
}
