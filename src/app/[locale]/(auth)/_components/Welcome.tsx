"use client";

import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/atoms/Button";
import { ModelConstellation } from "@/components/atoms/ModelConstellation";
import { cx } from "@/components/atoms/states";
import { TextLink } from "@/components/atoms/TextLink";
import { LanguageOption } from "@/components/molecules/LanguageOption";
import { Link, useRouter } from "@/lib/i18n/navigation";
import { locales, type Locale } from "@/lib/i18n/config";

// Figma: M1 · Welcome & language (mobile only). Choosing a language switches the URL locale
// (/sign-in ↔ /bn/sign-in); Continue and "Sign in" go to the phone step (M16).

const PHONE_STEP = "/sign-in?step=phone";

export function Welcome({ className }: { className?: string }) {
  const t = useTranslations("auth");
  const tl = useTranslations("common.language");
  const locale = useLocale();
  const router = useRouter();
  const names: Record<Locale, string> = {
    en: tl("english"),
    bn: tl("bangla"),
  };

  return (
    <section
      className={cx("pb-7 flex min-h-dvh flex-col px-5 pt-14", className)}
    >
      <div className="flex flex-col items-center gap-5 text-center">
        <ModelConstellation />
        <h1 className="type-auth-hero-mobile whitespace-pre-line text-ink">
          {t("promise.title")}
        </h1>
        <p className="type-body text-ink-2">{t("welcome.body")}</p>
      </div>
      <div className="mt-auto flex flex-col gap-4 pt-10">
        <div className="flex flex-col gap-language-gap">
          <p id="welcome-language" className="type-ui-strong text-ink-2">
            {t("welcome.chooseLanguage")}
          </p>
          <div
            role="radiogroup"
            aria-labelledby="welcome-language"
            className="flex flex-col gap-language-gap"
          >
            {locales.map((l) => (
              <LanguageOption
                key={l}
                lang={l}
                selected={l === locale}
                onClick={() =>
                  l !== locale && router.replace("/sign-in", { locale: l })
                }
              >
                {names[l]}
              </LanguageOption>
            ))}
          </div>
          <p className="type-ui text-ink-2">{t("welcome.languageHelp")}</p>
        </div>
        <Button
          onClick={() => router.push(PHONE_STEP)}
          className="h-auth-button-h-mobile! w-full type-auth-button-mobile!"
        >
          {t("welcome.continue")}
        </Button>
        <p className="flex justify-center gap-1-5 type-ui text-ink-2">
          {t("welcome.haveAccount")}
          <TextLink asChild className="type-ui-strong!">
            <Link href={PHONE_STEP}>{t("welcome.signIn")}</Link>
          </TextLink>
        </p>
      </div>
    </section>
  );
}
