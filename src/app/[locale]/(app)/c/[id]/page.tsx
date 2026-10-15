import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { LightField } from "@/components/atoms/LightField";
import { AppMain } from "@/components/templates/AppShell";
import { TEXT_CHATS, findChat } from "@/lib/mock/chat";

import { ChatRoute, ChatScreen } from "../../_chat/ChatScreen";

// A chat. The coffee-shop chat walks through every state of the prototype's ask-and-compare
// flow; see ../../_chat/state.ts for the steps and the ?state= deep links. Image chats belong to
// Image studio (not found here).
export function generateStaticParams() {
  return TEXT_CHATS.map((c) => ({ id: c.id }));
}

export default function ChatPage({ params }: PageProps<"/[locale]/c/[id]">) {
  // The id is URL data: read it behind Suspense so the App Shell stays shared (partial prefetch).
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
  if (!findChat(id)) notFound();
  return (
    <Suspense fallback={<ChatScreen id={id} />}>
      <ChatRoute id={id} />
    </Suspense>
  );
}
