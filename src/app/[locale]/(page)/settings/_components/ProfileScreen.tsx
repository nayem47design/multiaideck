"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import { cx, focusRing } from "@/components/atoms/states";
import { SaveBar } from "@/components/molecules/SaveBar";
import { SegmentedControl } from "@/components/molecules/SegmentedControl";
import { Select } from "@/components/molecules/Select";
import { SettingsHeading } from "@/components/molecules/SettingsHeading";
import { IdentityCard } from "@/components/organisms/IdentityCard";
import { PreferencesCard } from "@/components/organisms/PreferencesCard";
import { api } from "@/lib/api-client";
import { usePathname, useRouter } from "@/lib/i18n/navigation";
import { initialsOf, me, useMe } from "@/lib/me";
import { TEXT_SIZES, type TextSize } from "@/lib/text-size";
import type { ThemePreference } from "@/lib/theme";
import { useThemePreference } from "@/lib/use-theme";

import { useOverlay } from "../../../_shell/overlays";
import { useDeleteAccount } from "./DeleteAccount";
import { useTextSize } from "./textSize";
import { MobileHeader, ScreenBody } from "./ScreenParts";
import { type Preferences, useSettings } from "./SettingsState";

// Figma: Settings · Profile (28:10344). Identity and preferences; the Save bar appears while there
// are unsaved changes (Figma shows "You changed your display name"). App language applies at
// once, since it changes the URL (/ or /bn).

export function ProfileScreen({ className }: { className?: string }) {
  const t = useTranslations("settings.profile");
  const [theme, setTheme] = useThemePreference();
  const [textSize, setTextSize] = useTextSize();
  const ta = useTranslations("account");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const { openOverlay } = useOverlay();
  const openDelete = useDeleteAccount();
  const { profile, saveProfile, showToast } = useSettings();
  const { user } = useMe();

  // Unset = not edited: show what's saved (it arrives after the first render).
  const [nameEdit, setName] = useState<string>();
  const [prefsEdit, setPrefs] = useState<Preferences>();
  const [saving, setSaving] = useState(false);
  const name = nameEdit ?? profile.name;
  const prefs = prefsEdit ?? profile.preferences;

  const nameChanged = name !== profile.name;
  const prefsChanged = (Object.keys(prefs) as (keyof Preferences)[]).some(
    (k) => prefs[k] !== profile.preferences[k],
  );
  const dirty = nameChanged || prefsChanged;

  const setPref = <K extends keyof Preferences>(
    key: K,
    value: Preferences[K],
  ) => setPrefs({ ...prefs, [key]: value });

  const segmented = (
    label: string,
    value: string,
    options: { value: string; label: string }[],
    onChange: (v: string) => void,
  ) => (
    <SegmentedControl
      label={label}
      value={value}
      options={options}
      onValueChange={onChange}
      className="[&>*]:px-4"
    />
  );

  return (
    <div className={cx("flex flex-col", className)}>
      <MobileHeader title={t("title")} />
      <ScreenBody>
        <SettingsHeading
          className="max-md:hidden"
          title={t("title")}
          subtitle={t("subtitle")}
        />
        <div className="flex flex-col gap-4">
          <IdentityCard
            responsive
            title={t("identity.title")}
            initials={user ? initialsOf(user) : ""}
            name={name}
            changePhoto={{
              label: t("identity.changePhoto"),
              onClick: () => showToast(t("identity.photoSoon")),
            }}
            photoHint={t("identity.photoHint")}
            displayName={{
              label: t("identity.displayName"),
              value: name,
              onValueChange: setName,
              help: t("identity.displayNameHelp"),
            }}
            email={{
              label: t("identity.email"),
              value: user?.email ?? (user ? t("identity.noEmail") : ""),
              verifiedLabel: user?.emailVerified
                ? t("identity.verified")
                : undefined,
              change: {
                label: t("identity.change"),
                onClick: () => showToast(t("identity.emailSoon")),
              },
              help: t("identity.emailHelp"),
            }}
          />
          <PreferencesCard
            responsive
            title={t("preferences.title")}
            rows={[
              {
                title: t("preferences.appLanguage"),
                help: t("preferences.appLanguageHelp"),
                control: segmented(
                  t("preferences.appLanguage"),
                  locale,
                  [
                    { value: "en", label: t("preferences.english") },
                    { value: "bn", label: t("preferences.bangla") },
                  ],
                  (next) => {
                    // Saved to the account too, so sign-in and SMS use it.
                    api("/api/me", { method: "PATCH", body: { locale: next } })
                      .then(() => me.refresh())
                      .catch(() => showToast(ta("languageFailed"), "error"));
                    router.replace(pathname, { locale: next });
                  },
                ),
              },
              {
                title: t("preferences.theme"),
                help: t("preferences.themeHelp"),
                control: segmented(
                  t("preferences.theme"),
                  theme,
                  (["system", "light", "dark"] as const).map((v) => ({
                    value: v,
                    label: t(`preferences.themes.${v}`),
                  })),
                  (v) => setTheme(v as ThemePreference),
                ),
              },
              {
                title: t("preferences.textSize"),
                help: t("preferences.textSizeHelp"),
                control: segmented(
                  t("preferences.textSize"),
                  textSize,
                  TEXT_SIZES.map((v) => ({
                    value: v,
                    label: t(`preferences.textSizes.${v}`),
                  })),
                  (v) => setTextSize(v as TextSize),
                ),
              },
              {
                title: t("preferences.answerLanguage"),
                help: t("preferences.answerLanguageHelp"),
                control: (
                  <Select
                    label={t("preferences.answerLanguage")}
                    value={prefs.answerLanguage}
                    onValueChange={(v) =>
                      setPref(
                        "answerLanguage",
                        v as Preferences["answerLanguage"],
                      )
                    }
                    className="w-select-width"
                    options={[
                      { value: "same", label: t("preferences.answerSame") },
                      { value: "en", label: t("preferences.english") },
                      { value: "bn", label: t("preferences.bangla") },
                    ]}
                  />
                ),
              },
              {
                title: t("preferences.amounts"),
                help: t("preferences.amountsHelp"),
                control: segmented(
                  t("preferences.amounts"),
                  prefs.amounts,
                  [
                    { value: "both", label: t("preferences.amountsBoth") },
                    {
                      value: "credits",
                      label: t("preferences.amountsCredits"),
                    },
                  ],
                  (v) => setPref("amounts", v as Preferences["amounts"]),
                ),
              },
              {
                title: t("preferences.density"),
                help: t("preferences.densityHelp"),
                control: segmented(
                  t("preferences.density"),
                  prefs.density,
                  [
                    {
                      value: "comfortable",
                      label: t("preferences.comfortable"),
                    },
                    { value: "compact", label: t("preferences.compact") },
                  ],
                  (v) => setPref("density", v as Preferences["density"]),
                ),
              },
            ]}
          />
          <div className="flex flex-wrap items-center gap-4 px-2 py-1">
            <h2 className="flex-1 type-settings-account-label text-ink-2">
              {t("account.label")}
            </h2>
            <button
              type="button"
              aria-haspopup="dialog"
              onClick={() => openOverlay("sign-out")}
              className={cx(
                "rounded-xs type-settings-link text-ink hover:underline",
                focusRing,
              )}
            >
              {t("account.signOut")}
            </button>
            <button
              type="button"
              aria-haspopup="dialog"
              onClick={openDelete}
              className={cx(
                "rounded-xs type-settings-link text-error hover:underline",
                focusRing,
              )}
            >
              {t("account.delete")}
            </button>
          </div>
        </div>
        {dirty && (
          <SaveBar
            className="sticky bottom-1-5 z-20 mx-auto max-w-settings-save-bar-width"
            message={
              nameChanged && !prefsChanged
                ? t("save.nameChanged")
                : t("save.changed")
            }
            saveLabel={t("save.save")}
            discardLabel={t("save.discard")}
            saving={saving}
            onDiscard={() => {
              setName(undefined);
              setPrefs(undefined);
            }}
            onSave={() => {
              const trimmed = name.trim();
              if (!trimmed) {
                showToast(t("save.nameEmpty"), "error");
                return;
              }
              setSaving(true);
              saveProfile({ name: trimmed, preferences: prefs })
                .then(() => {
                  setName(undefined);
                  setPrefs(undefined);
                  showToast(t("save.saved"));
                })
                .catch(() => showToast(t("save.failed"), "error"))
                .finally(() => setSaving(false));
            }}
          />
        )}
      </ScreenBody>
    </div>
  );
}
