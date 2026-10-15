"use client";

import { useFormatter, useLocale, useTranslations } from "next-intl";
import { useLayoutEffect, useState } from "react";

import { Icon } from "@/components/atoms/Icon";
import { cx, focusRing } from "@/components/atoms/states";
import { AccountProfileRow } from "@/components/molecules/AccountProfileRow";
import { AccountMenuList } from "@/components/organisms/AccountMenuList";
import { EasyReadingCard } from "@/components/organisms/EasyReadingCard";
import { LanguageSheet } from "@/components/organisms/LanguageSheet";
import { MobileTopBar } from "@/components/organisms/MobileTopBar";
import { Link, usePathname, useRouter } from "@/lib/i18n/navigation";
import { DEMO_USER } from "@/lib/mock/demo";
import { DEMO_USAGE_SUMMARY, type TextSize } from "@/lib/mock/settings";

import { useOverlay } from "../../../_shell/overlays";
import { useTextSize } from "./textSize";

// Figma: M15 · Account & settings (the Account tab root, below 768px), with M39's language sheet.
// The profile card goes to Privacy & security, as in the prototype.

/** "1712 345 214" → "+880 17•• ••• 214", as on M15. */
function maskPhone(phone: string) {
  const groups = phone.split(" ");
  return [
    "+880",
    groups[0].slice(0, 2) + "••",
    ...groups.slice(1, -1).map((g) => "•".repeat(g.length)),
    groups.at(-1),
  ].join(" ");
}

export function AccountHome({ className }: { className?: string }) {
  const t = useTranslations("account");
  const tc = useTranslations("common.language");
  const format = useFormatter();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const { openOverlay } = useOverlay();
  const [textSize, setTextSize] = useTextSize();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [language, setLanguage] = useState(locale);

  // Pages stay mounted (hidden) after navigation; don't come back to an open sheet.
  useLayoutEffect(() => () => setSheetOpen(false), []);

  return (
    <div className={cx("flex flex-col", className)}>
      <MobileTopBar title={t("title")} />
      <div className="flex flex-col gap-3 px-mobile-gutter pt-1 pb-[calc(var(--tab-bar-height)+var(--space-6))]">
        <AccountProfileRow
          initials={DEMO_USER.initials}
          name={DEMO_USER.name}
          detail={maskPhone(DEMO_USER.phone)}
          link={<Link href="/settings/privacy" aria-label={t("openProfile")} />}
        />
        <EasyReadingCard
          title={t("reading.title")}
          label={t("reading.textSize")}
          options={(["normal", "large", "larger"] as const).map((v) => ({
            value: v,
            label: t(`reading.${v}`),
          }))}
          value={textSize}
          onValueChange={(v) => setTextSize(v as TextSize)}
          help={t("reading.help")}
        />
        <AccountMenuList
          items={[
            {
              id: "language",
              icon: "globe-02",
              label: t("rows.language"),
              value: locale === "bn" ? tc("bangla") : tc("english"),
              "aria-haspopup": "dialog",
              onClick: () => {
                setLanguage(locale);
                setSheetOpen(true);
              },
            },
            {
              id: "usage",
              icon: "chart-histogram",
              label: t("rows.usage"),
              value: t("rows.usageValue", {
                credits: format.number(DEMO_USAGE_SUMMARY.credits),
              }),
              link: <Link href="/settings/usage" />,
            },
            {
              id: "notifications",
              icon: "notification-01",
              label: t("rows.notifications"),
              link: <Link href="/settings/notifications" />,
            },
            {
              id: "privacy",
              icon: "shield-01",
              label: t("rows.privacy"),
              link: <Link href="/settings/privacy" />,
            },
            {
              id: "help",
              icon: "help-circle",
              label: t("rows.help"),
              value: t("rows.helpValue"),
              link: <Link href="/settings/help" />,
            },
          ]}
        />
        <button
          type="button"
          aria-haspopup="dialog"
          onClick={() => openOverlay("sign-out")}
          className={cx(
            "flex h-acct-sign-out-height items-center justify-center gap-2 rounded-pill type-acct-row-label text-error",
            "transition-colors duration-fast ease-out hover:bg-status-error-soft",
            focusRing,
          )}
        >
          <Icon name="logout-03" className="size-icon-md" />
          {t("signOut")}
        </button>
      </div>
      <LanguageSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title={t("language.title")}
        options={[
          {
            value: "en",
            title: tc("english"),
            help: t("language.englishHelp"),
            lang: "en",
          },
          {
            value: "bn",
            title: tc("bangla"),
            help: t("language.banglaHelp"),
            lang: "bn",
          },
        ]}
        value={language}
        onValueChange={setLanguage}
        note={t("language.note")}
        doneLabel={t("language.done")}
        onDone={() => {
          setSheetOpen(false);
          if (language !== locale)
            router.replace(pathname, { locale: language });
        }}
      />
    </div>
  );
}
