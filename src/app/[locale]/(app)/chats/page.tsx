import { setRequestLocale } from "next-intl/server";

import { LightField } from "@/components/atoms/LightField";

import { ChatsScreen } from "./_components/ChatsScreen";

export default async function ChatsPage({
  params,
}: PageProps<"/[locale]/chats">) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <>
      <LightField variant="app" fixed />
      <ChatsScreen />
    </>
  );
}
