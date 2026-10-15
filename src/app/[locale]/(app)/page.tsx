import { setRequestLocale } from "next-intl/server";

import { LightField } from "@/components/atoms/LightField";
import { AppMain } from "@/components/templates/AppShell";

// Placeholder until the Home screen is built (Phase 5).
export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <>
      <LightField variant="app" fixed />
      <AppMain>{null}</AppMain>
    </>
  );
}
