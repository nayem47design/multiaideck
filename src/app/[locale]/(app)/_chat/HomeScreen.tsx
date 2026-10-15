"use client";

import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useState, useSyncExternalStore } from "react";

import { cx } from "@/components/atoms/states";
import { CreditsPill } from "@/components/molecules/CreditsPill";
import { LanguageSwitch } from "@/components/molecules/LanguageSwitch";
import { AiOrbGroup } from "@/components/molecules/AiOrbGroup";
import { StarterRow } from "@/components/molecules/StarterRow";
import { HomeHero } from "@/components/organisms/HomeHero";
import { AppMain } from "@/components/templates/AppShell";
import { ApiClientError } from "@/lib/api-client";
import { Link, usePathname, useRouter } from "@/lib/i18n/navigation";
import { useMe } from "@/lib/me";
import { DEMO_VOICE } from "@/lib/mock/chat";

import { sendPrompt } from "./api";
import { parseParams } from "./state";
import { useComposer, type AnswerMode } from "./useComposer";
import { useChatFormat } from "./useFormat";

// Home (new chat). Desktop: the Home hero with the Composer inside it. Below 768px: M2 (credits,
// language, greeting, starters) with the Mobile composer docked above the tab bar.
// Send creates the chat (POST /api/chats) and opens it, where the answers stream in.

type Greeting = "morning" | "afternoon" | "evening";

const noop = () => () => {};

function greetingFor(hour: number): Greeting {
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

/** Reads the deep-link params (?composer=…, ?sheet=…); render inside <Suspense>. */
export function HomeRoute() {
  const sp = useSearchParams();
  const p = parseParams(new URLSearchParams(sp.toString()));
  return (
    <HomeScreen
      key={sp.toString()}
      initial={p.composer}
      initialSheet={p.sheet}
    />
  );
}

export function HomeScreen({
  initial,
  initialSheet,
}: {
  initial?: ReturnType<typeof parseParams>["composer"];
  initialSheet?: ReturnType<typeof parseParams>["sheet"];
}) {
  const t = useTranslations("home");
  const tc = useTranslations("common");
  const tco = useTranslations("composer");
  const { n } = useChatFormat();
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const [mode, setMode] = useState<AnswerMode>("best");
  // Figma shows "Good evening"; the real greeting follows the user's clock after hydration.
  const greeting = useSyncExternalStore<Greeting>(
    noop,
    () => greetingFor(new Date().getHours()),
    () => "evening",
  );

  const { user, balance, refresh } = useMe();

  const composer = useComposer({
    context: "home",
    mode,
    onModeChange: setMode,
    onSend: async ({ text, models, attachments }) => {
      try {
        const sent = await sendPrompt({ text, mode, models, attachments });
        void refresh(); // the hold shows in the balance right away
        router.push(`/c/${sent.chatId}`);
      } catch (e) {
        if (e instanceof ApiClientError && e.code === "insufficient_credits")
          router.push("/wallet/top-up");
        return false;
      }
    },
    voiceText: DEMO_VOICE.home,
    placeholder: {
      desktop: tco("placeholder.home"),
      mobile: tco("placeholder.home"),
    },
    initial,
    initialSheet,
  });

  const name = user?.name.trim().split(/\s+/)[0] ?? "";
  const credits = balance?.credits ?? 0;
  return (
    <AppMain
      className="max-md:pt-0"
      composer={
        <>
          <div className="max-md:mb-tab-bar-height md:hidden">
            {composer.mobileComposer}
          </div>
          <p className="text-center type-caption text-ink-3 max-md:hidden">
            {tc("footnote")}
          </p>
        </>
      }
    >
      {/* Desktop and tablet: the Home hero */}
      <div className="flex min-h-full items-center justify-center px-6 pb-6 max-md:hidden lg:px-0">
        <HomeHero
          className="max-w-composer-width"
          greeting={t(`greeting.${greeting}`, { name })}
          subtitle={t("subtitle")}
          composer={composer.desktopProps}
          modeExplainer={t(`explainer.${mode}`)}
          starters={[
            {
              icon: "layers-01",
              title: t("starters.compare.title"),
              description: t("starters.compare.description"),
              onClick: () => setMode("compare"),
            },
            {
              icon: "globe-02",
              title: t("starters.bangla.title"),
              description: t("starters.bangla.description"),
              onClick: () => composer.setValue(t("banglaPrompt")),
            },
            {
              icon: "image-01",
              title: t("starters.image.title"),
              description: t("starters.image.description"),
              onClick: () => router.push("/images"),
            },
          ]}
        />
      </div>

      {/* Mobile: M2 · Home */}
      <div className="flex flex-col px-4 md:hidden">
        <div className="flex h-mobile-top-bar-height items-center justify-between gap-2">
          <CreditsPill
            credits={tc("credits", { amount: n(Math.floor(credits)) })}
            money={tc("taka", {
              amount: n(Math.floor(balance?.bdt ?? 0)),
            })}
            link={<Link href="/wallet" aria-label={t("mobile.balance")} />}
          />
          <LanguageSwitch
            label={tc("language.label")}
            options={(["en", "bn"] as const).map((l) => ({
              label: tc(`language.${l}`),
              name: tc(l === "en" ? "language.english" : "language.bangla"),
              lang: l,
              selected: locale === l,
              link: <Link href={pathname} locale={l} />,
            }))}
          />
        </div>
        <div className="mt-3 flex flex-col items-center gap-2 text-center">
          <AiOrbGroup size="lg" />
          <h1 className="type-chat-m-greeting text-ink">
            {t(`greeting.${greeting}`, { name })}
          </h1>
          <p className="type-body text-ink-2">{t("subtitleMobile")}</p>
        </div>
        <section className={cx("mt-10 flex flex-col gap-2 pb-4")}>
          <h2 className="type-ui-strong text-ink-2">{t("mobile.tryOne")}</h2>
          <StarterRow
            icon="globe-02"
            title={t("mobile.bangla.title")}
            description={t("mobile.bangla.description")}
            onClick={composer.prefillVoice}
          />
          <StarterRow
            icon="layers-01"
            title={t("mobile.compare.title")}
            description={t("mobile.compare.description")}
            onClick={composer.openModeSheet}
          />
          <StarterRow
            icon="image-01"
            title={t("mobile.image.title")}
            description={t("mobile.image.description")}
            onClick={() => router.push("/images")}
          />
        </section>
      </div>
      {composer.overlays}
    </AppMain>
  );
}
