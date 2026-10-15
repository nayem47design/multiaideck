import { setRequestLocale } from "next-intl/server";

import { LightField } from "@/components/atoms/LightField";

import { PresetsScreen } from "./_components/PresetsScreen";

export default async function PresetsPage({
  params,
}: PageProps<"/[locale]/presets">) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <>
      <LightField variant="app" fixed />
      <PresetsScreen />
    </>
  );
}
