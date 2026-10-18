"use client";

import { useFormatter, useLocale, useTranslations } from "next-intl";
import { useEffect, useLayoutEffect, useState } from "react";

import { Icon } from "@/components/atoms/Icon";
import { cx, focusRing } from "@/components/atoms/states";
import { AccountProfileRow } from "@/components/molecules/AccountProfileRow";
import { AccountMenuList } from "@/components/organisms/AccountMenuList";
import { TextSizePicker } from "@/components/molecules/TextSizePicker";
import { EasyReadingCard } from "@/components/organisms/EasyReadingCard";
import type { ThemePreference } from "@/lib/theme";
import { useThemePreference } from "@/lib/use-theme";
import { LanguageSheet } from "@/components/organisms/LanguageSheet";
import { MobileTopBar } from "@/components/organisms/MobileTopBar";
import { api } from "@/lib/api-client";
import { WalletResponse } from "@/lib/contracts/wallet";
import { Link, usePathname, useRouter } from "@/lib/i18n/navigation";
import { displayName, initialsOf, me, nationalPhone, useMe } from "@/lib/me";
import { TEXT_SIZES, type TextSize } from "@/lib/text-size";

import { useOverlay } from "../../../_shell/overlays";
import { useTextSize } from "./textSize";

// Figma: M15 · Account & settings (the Account tab root, below 768px), with M39's language sheet.
// The profile card goes to Privacy & security, as in the prototype.

/** "+8801712345214" → "+880 17•• ••• 214", as on M15. */
function maskPhone(phone: string) {
  const groups = nationalPhone(phone).split(" ");
  return [
    "+880",
    groups[0].slice(0, 2) + "••",
    ...groups.slice(1, -1).map((g) => "•".repeat(g.length)),
    groups.at(-1),
  ].join(" ");
}

export function AccountHome({ className }: { className?: string }) {
  const t = useTranslations("account");
  const [theme, setTheme] = useThemePreference();
  const tc = useTranslations("common.language");
  const format = useFormatter();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const { openOverlay } = useOverlay();
  const [textSize, setTextSize] = useTextSize();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [language, setLanguage] = useState(locale);
  const { user } = useMe();
  // "N credits this month" from the wallet summary; left blank until it answers.
  const [spent, setSpent] = useState<number>();
  useEffect(() => {
    let live = true;
    api("/api/wallet", { schema: WalletResponse })
      .then((w) => {
        if (live) setSpent(w.spentThisMonth.credits);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);

  // Pages stay mounted (hidden) after navigation; don't come back to an open sheet.
  useLayoutEffect(() => () => setSheetOpen(false), []);

  return (
    <div className={cx("flex flex-col", className)}>
      <MobileTopBar title={t("title")} />
      <div className="flex flex-col gap-3 px-mobile-gutter pt-1 pb-[calc(var(--tab-bar-height)+var(--space-6))]">
        <AccountProfileRow
          initials={user ? initialsOf(user) : ""}
          name={user ? displayName(user) : ""}
          detail={user?.phone ? maskPhone(user.phone) : (user?.email ?? "")}
          link={<Link href="/settings/privacy" aria-label={t("openProfile")} />}
        />
        <EasyReadingCard title={t("reading.title")} help={t("reading.help")}>
          <TextSizePicker
            label={t("reading.textSize")}
            sample={t("reading.sample")}
            options={TEXT_SIZES.map((v) => ({
              value: v,
              name: t(`reading.${v}`),
            }))}
            value={textSize}
            onValueChange={(v) => setTextSize(v as TextSize)}
          />
        </EasyReadingCard>
        <EasyReadingCard
          title={t("appearance.title")}
          label={t("appearance.theme")}
          options={(["system", "light", "dark"] as const).map((v) => ({
            value: v,
            label: t(`appearance.${v}`),
          }))}
          value={theme}
          onValueChange={(v) => setTheme(v as ThemePreference)}
          help={t("appearance.help")}
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
              value:
                spent === undefined
                  ? undefined
                  : t("rows.usageValue", {
                      credits: format.number(Math.round(spent)),
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
          if (language !== locale) {
            // Saved to the account too, so sign-in and SMS use it.
            api("/api/me", { method: "PATCH", body: { locale: language } })
              .then(() => me.refresh())
              .catch(() => {});
            router.replace(pathname, { locale: language });
          }
        }}
      />
    </div>
  );
}
