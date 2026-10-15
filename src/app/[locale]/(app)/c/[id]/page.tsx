import { setRequestLocale } from "next-intl/server";
import { Suspense } from "react";

import { LightField } from "@/components/atoms/LightField";
import { AppMain } from "@/components/templates/AppShell";

import { ChatRoute } from "../../_chat/ChatScreen";

// A chat. Chats live in the database, so ids are runtime data: the page reads the param behind
// <Suspense> and the chat loads in the browser (GET /api/chats/:id, then its live stream); an
// unknown or deleted chat renders not-found.
//
// generateStaticParams gives Cache Components one sample id (not a real chat) so the route is
// validated at build time and the shell's client hooks (usePathname in the sidebar and tab bar,
// outside <Suspense>) don't block rendering; every real id renders on demand (dynamicParams).
export function generateStaticParams() {
  return [{ id: "sample" }];
}

export default function ChatPage({ params }: PageProps<"/[locale]/c/[id]">) {
  return (
    <>
      <LightField variant="dimmed" fixed />
      <Suspense fallback={<AppMain>{null}</AppMain>}>
        <Chat params={params} />
      </Suspense>
    </>
  );
}

async function Chat({ params }: Pick<PageProps<"/[locale]/c/[id]">, "params">) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  return (
    <Suspense fallback={<AppMain>{null}</AppMain>}>
      <ChatRoute key={id} id={id} />
    </Suspense>
  );
}
