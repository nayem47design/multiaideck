"use client";

import { useTranslations } from "next-intl";
import {
  cloneElement,
  useLayoutEffect,
  useState,
  type ReactElement,
} from "react";

import { Button } from "@/components/atoms/Button";
import { Icon } from "@/components/atoms/Icon";
import { cx, focusRing } from "@/components/atoms/states";
import { SettingsHeading } from "@/components/molecules/SettingsHeading";
import { TipCard } from "@/components/molecules/TipCard";
import { AccountMenuList } from "@/components/organisms/AccountMenuList";
import { DataCard } from "@/components/organisms/DataCard";
import {
  SignInMethodsCard,
  type SignInMethod,
} from "@/components/organisms/SignInMethodsCard";
import { Link } from "@/lib/i18n/navigation";
import { DEMO_USER } from "@/lib/mock/demo";
import { DEMO_SUPPORT } from "@/lib/mock/settings";

import { useDeleteAccount } from "./DeleteAccount";
import { downloadProfileData } from "./download";
import { MobileHeader, ScreenBody } from "./ScreenParts";
import { useSettings } from "./SettingsState";

// Figma: Settings · Privacy & security (28:10645): sign-in methods with the "set a password" form,
// your data, legal links. Below 768px: M41 · Privacy & security.

const RULE_SYMBOL = /[\d\W_]/;

function strength(password: string) {
  const length = password.length >= 8;
  const symbol = RULE_SYMBOL.test(password);
  const score =
    (length ? 1 : 0) +
    (symbol ? 1 : 0) +
    (password.length >= 10 ? 1 : 0) +
    (password.length >= 14 && /[a-z]/.test(password) && /[A-Z]/.test(password)
      ? 1
      : 0);
  return { length, symbol, score: password ? Math.max(score, 1) : 0 };
}

const LEVELS = ["weak", "weak", "fair", "good", "strong"] as const;

export function PrivacyScreen() {
  const t = useTranslations("settings.privacy");
  const openDelete = useDeleteAccount();
  const { profile, notifications, passwordSet, setPasswordSet, showToast } =
    useSettings();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showMethods, setShowMethods] = useState(false);

  // Pages stay mounted (hidden) after navigation; don't keep a typed password around.
  useLayoutEffect(
    () => () => {
      setPassword("");
      setConfirm("");
    },
    [],
  );

  const s = strength(password);
  const download = () => {
    downloadProfileData(profile, { notifications });
    showToast(t("data.downloaded"));
  };

  const google: SignInMethod = {
    id: "google",
    icon: "user",
    title: t("signIn.google"),
    help: t("signIn.googleHelp", { email: DEMO_USER.email }),
    status: { label: t("signIn.connected"), connected: true },
  };

  const external = (href: string) => (
    <a href={href} target="_blank" rel="noopener noreferrer" />
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
        <div className="flex flex-col gap-4 max-md:hidden">
          <SignInMethodsCard
            title={t("signIn.title")}
            methods={[
              google,
              {
                id: "password",
                icon: "key-01",
                title: t("signIn.password"),
                help: passwordSet
                  ? t("signIn.passwordSet", { email: DEMO_USER.email })
                  : t("signIn.passwordNotSet"),
                status: passwordSet
                  ? { label: t("signIn.isSet"), connected: true }
                  : { label: t("signIn.notSet"), connected: false },
              },
            ]}
            setPassword={
              passwordSet
                ? undefined
                : {
                    afterMethod: "password",
                    form: {
                      password: {
                        label: t("signIn.newPassword"),
                        value: password,
                        onValueChange: setPassword,
                      },
                      confirm: {
                        label: t("signIn.confirm"),
                        value: confirm,
                        placeholder: t("signIn.confirmPlaceholder"),
                        onValueChange: setConfirm,
                      },
                      strength: {
                        score: s.score,
                        label: t(`signIn.strength.${LEVELS[s.score]}`),
                        rules: [
                          { label: t("signIn.ruleLength"), met: s.length },
                          { label: t("signIn.ruleSymbol"), met: s.symbol },
                        ],
                      },
                      showLabel: t("signIn.show"),
                      hideLabel: t("signIn.hide"),
                      cancelLabel: t("signIn.cancel"),
                      submitLabel: t("signIn.submit"),
                      onCancel: () => {
                        setPassword("");
                        setConfirm("");
                      },
                      onSubmit: () => {
                        if (!s.length || !s.symbol)
                          return showToast(t("signIn.tooWeak"), "error");
                        if (password !== confirm)
                          return showToast(t("signIn.mismatch"), "error");
                        setPasswordSet(true);
                        setPassword("");
                        setConfirm("");
                        showToast(t("signIn.saved"));
                      },
                    },
                  }
            }
          />
          <DataCard
            title={t("data.title")}
            rows={[
              {
                icon: "bubble-chat",
                title: t("data.history"),
                help: t("data.historyHelp"),
                action: (
                  <Button
                    variant="secondary"
                    size="sm"
                    icon="link-square-02"
                    iconSize="sm"
                    onClick={() =>
                      window.open(
                        DEMO_SUPPORT.privacyUrl,
                        "_blank",
                        "noopener,noreferrer",
                      )
                    }
                  >
                    {t("data.privacyPolicy")}
                  </Button>
                ),
              },
              {
                icon: "download-01",
                title: t("data.download"),
                help: t("data.downloadHelp"),
                action: (
                  <Button
                    variant="secondary"
                    size="sm"
                    icon="download-01"
                    iconSize="sm"
                    onClick={download}
                  >
                    {t("data.downloadButton")}
                  </Button>
                ),
              },
            ]}
          />
          <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 px-2 py-1">
            <LegalLink link={external(DEMO_SUPPORT.termsUrl)}>
              {t("legal.terms")}
            </LegalLink>
            <LegalLink link={external(DEMO_SUPPORT.privacyUrl)}>
              {t("legal.privacy")}
            </LegalLink>
            <LegalLink link={<Link href="/settings/help" />}>
              {t("legal.contact")}
            </LegalLink>
          </nav>
        </div>

        <div className="flex flex-col gap-3 md:hidden">
          <TipCard icon="shield-01" title={t("mobile.privateTitle")}>
            {t("mobile.privateBody")}
          </TipCard>
          <AccountMenuList
            items={[
              {
                id: "sign-in",
                icon: "smart-phone-01",
                label: t("mobile.signIn"),
                value: t("mobile.signInValue"),
                expanded: showMethods,
                onClick: () => setShowMethods((v) => !v),
              },
              {
                id: "download",
                icon: "arrow-down-01",
                label: t("mobile.download"),
                onClick: download,
              },
              {
                id: "history",
                icon: "clock-01",
                label: t("mobile.deleteHistory"),
                link: <Link href="/chats" />,
              },
            ]}
          />
          {showMethods && (
            <SignInMethodsCard
              title={t("signIn.title")}
              methods={[
                {
                  id: "phone",
                  icon: "smart-phone-01",
                  title: t("signIn.phone"),
                  help: t("signIn.phoneHelp", {
                    phone: `+880 ${DEMO_USER.phone}`,
                  }),
                  status: { label: t("signIn.connected"), connected: true },
                },
                google,
              ]}
            />
          )}
          <AccountMenuList
            items={[
              {
                id: "delete",
                icon: "delete-02",
                label: t("mobile.deleteAccount"),
                tone: "danger",
                "aria-haspopup": "dialog",
                onClick: openDelete,
              },
            ]}
          />
          <p className="type-ui text-ink-2">{t("mobile.deleteNote")}</p>
        </div>
      </ScreenBody>
    </div>
  );
}

function LegalLink({
  link,
  children,
}: {
  link: ReactElement<{ className?: string }>;
  children: string;
}) {
  return cloneElement(
    link,
    {
      className: cx(
        "inline-flex items-center gap-1 rounded-xs type-settings-link text-ink-2 hover:text-ink hover:underline",
        focusRing,
      ),
    },
    children,
    <Icon key="icon" name="link-square-02" className="size-3" />,
  );
}
