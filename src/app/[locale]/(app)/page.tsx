import { setRequestLocale } from "next-intl/server";
import { Suspense } from "react";

import { LightField } from "@/components/atoms/LightField";

import { HomeRoute, HomeScreen } from "./_chat/HomeScreen";

// Home (new chat): desktop "Home" (+ “+” menu, voice, files variants) and mobile M2, M3, M4, M7,
// M18, M19, M25. Deep links: ?composer=menu|voice|voice-ready|files, ?sheet=mode|models.
export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <>
      <LightField variant="app" fixed />
      <Suspense fallback={<HomeScreen />}>
        <HomeRoute />
      </Suspense>
    </>
  );
}
