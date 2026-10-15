"use client";

import { useTranslations } from "next-intl";

import { ContactCard } from "@/components/molecules/ContactCard";
import { SettingsHeading } from "@/components/molecules/SettingsHeading";
import { FaqList } from "@/components/organisms/FaqList";
import { DEMO_SUPPORT } from "@/lib/mock/settings";

import { MobileHeader, ScreenBody } from "./ScreenParts";

// Figma: Settings · Help & support (166:28617). Below 768px: M42 · Help & support (shorter copy,
// no buttons on the contact cards).

const FAQ = ["credit", "failed", "bkash", "bangla", "delete"] as const;

export function HelpScreen() {
  const t = useTranslations("settings.help");

  // Copy that differs between the desktop screen and M42.
  const responsive = (long: string, short: string) => (
    <>
      <span className="md:hidden">{short}</span>
      <span className="max-md:hidden">{long}</span>
    </>
  );

  return (
    <div className="flex flex-col">
      <MobileHeader title={t("title")} />
      <ScreenBody>
        <SettingsHeading
          className="max-md:hidden"
          title={t("title")}
          subtitle={t("subtitle")}
        />
        <div className="flex flex-col gap-3 md:gap-4">
          <div className="flex gap-3 md:gap-4">
            <ContactCard
              icon="bubble-chat"
              title={t("chat.title")}
              body={responsive(t("chat.body"), t("chat.bodyShort"))}
              actionLabel={t("chat.action")}
              link={<a href={DEMO_SUPPORT.chatUrl} />}
            />
            <ContactCard
              icon="smart-phone-01"
              title={t("call.title")}
              body={responsive(t("call.body"), t("call.bodyShort"))}
              actionLabel={t("call.action")}
              link={<a href={`tel:${DEMO_SUPPORT.phone}`} />}
            />
          </div>
          <h2 className="type-help-group-label text-ink-2 max-md:type-acct-card-title">
            {t("common")}
          </h2>
          <FaqList
            items={FAQ.map((id) => ({
              id,
              question: responsive(t(`faq.${id}.q`), t(`faq.${id}.qShort`)),
              answer: t(`faq.${id}.a`),
            }))}
          />
        </div>
      </ScreenBody>
    </div>
  );
}
