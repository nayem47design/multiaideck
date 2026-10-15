"use client";

import { useFormatter, useTranslations } from "next-intl";

import { Banner } from "@/components/molecules/Banner";
import { SettingsHeading } from "@/components/molecules/SettingsHeading";
import { Stepper } from "@/components/molecules/Stepper";
import { ToggleCard } from "@/components/molecules/ToggleCard";
import { NotificationMatrix } from "@/components/organisms/NotificationMatrix";
import { CREDIT_IN_BDT } from "@/lib/mock/demo";
import { DEMO_LOW_BALANCE, DEMO_USAGE_SUMMARY } from "@/lib/mock/settings";

import { MobileHeader, ScreenBody } from "./ScreenParts";
import { useSettings } from "./SettingsState";

// Figma: Settings · Notifications (28:10479): types × channels with the low-balance threshold.
// Below 768px: M40 · Notifications, four simpler switches.

const GROUPS = [
  { key: "money", types: ["lowBalance", "receipts"] },
  { key: "usage", types: ["weekly"] },
  { key: "reliability", types: ["failed"] },
  { key: "product", types: ["models", "offers"] },
] as const;

export function NotificationsScreen() {
  const t = useTranslations("settings.notifications");
  const tc = useTranslations("common");
  const format = useFormatter();
  const {
    notifications,
    setNotification,
    lowBalance,
    setLowBalance,
    mobileNotifications,
    setMobileNotification,
  } = useSettings();

  // "About N chats" uses the average cost per prompt this month (Settings · Usage).
  const average = DEMO_USAGE_SUMMARY.credits / DEMO_USAGE_SUMMARY.prompts;
  const credits = format.number(lowBalance);

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
          <Banner
            tone="info"
            title={t("banner.title")}
            body={t("banner.body")}
          />
          <NotificationMatrix
            channels={[
              { id: "app", label: t("channels.app") },
              { id: "email", label: t("channels.email") },
            ]}
            groups={GROUPS.map((group) => ({
              label: t(`groups.${group.key}`),
              types: group.types.map((type) => ({
                id: type,
                title: t(`types.${type}.title`),
                help: t(`types.${type}.help`),
                values: notifications[type],
                lockedLabel: type === "receipts" ? t("alwaysOn") : undefined,
                extra:
                  type === "lowBalance" ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="type-setting-row-help text-ink-2">
                        {t("alertBelow")}
                      </span>
                      <Stepper
                        value={lowBalance}
                        onValueChange={setLowBalance}
                        min={DEMO_LOW_BALANCE.min}
                        max={DEMO_LOW_BALANCE.max}
                        step={DEMO_LOW_BALANCE.step}
                        valueLabel={t("threshold", { credits })}
                        decreaseLabel={t("lower")}
                        increaseLabel={t("higher")}
                      />
                      <span className="type-setting-row-help text-ink-3">
                        {t("thresholdMoney", {
                          money: tc("money", {
                            amount: format.number(lowBalance * CREDIT_IN_BDT),
                          }),
                          chats: Math.floor(lowBalance / average),
                        })}
                      </span>
                    </div>
                  ) : undefined,
              })),
            }))}
            onChange={setNotification}
          />
        </div>
        <div className="flex flex-col gap-3 md:hidden">
          <ToggleCard
            title={t("mobile.payments.title")}
            help={t("mobile.payments.help")}
            lockedLabel={t("alwaysOn")}
          />
          <ToggleCard
            title={t("mobile.lowBalance.title")}
            help={t("mobile.lowBalance.help", { credits })}
            checked={mobileNotifications.lowBalance}
            onCheckedChange={(on) => setMobileNotification("lowBalance", on)}
          />
          <ToggleCard
            title={t("mobile.longAnswers.title")}
            help={t("mobile.longAnswers.help")}
            checked={mobileNotifications.longAnswers}
            onCheckedChange={(on) => setMobileNotification("longAnswers", on)}
          />
          <ToggleCard
            title={t("mobile.offers.title")}
            help={t("mobile.offers.help")}
            checked={mobileNotifications.offers}
            onCheckedChange={(on) => setMobileNotification("offers", on)}
          />
        </div>
      </ScreenBody>
    </div>
  );
}
