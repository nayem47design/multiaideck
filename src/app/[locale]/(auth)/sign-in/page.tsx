import { setRequestLocale } from "next-intl/server";
import { Suspense } from "react";

import { SignInFromParams, SignInScreen } from "../_components/SignInScreen";

export default async function SignInPage({
  params,
}: PageProps<"/[locale]/sign-in">) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <Suspense fallback={<SignInScreen step="welcome" />}>
      <SignInFromParams />
    </Suspense>
  );
}
