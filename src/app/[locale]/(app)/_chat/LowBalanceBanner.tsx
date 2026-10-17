"use client";

import { useFormatter, useTranslations } from "next-intl";

import { cx, focusRing } from "@/components/atoms/states";
import { Banner } from "@/components/molecules/Banner";
import { Link } from "@/lib/i18n/navigation";
import { useMe } from "@/lib/me";

// Not in Figma yet (07 · Gaps › Low balance, P1): a Banner above the composer, built from the
// Gaps guidance. Warning when the balance is under the low-balance limit (the account default,
// 500 credits); Error when it can't cover the question being typed. Sending with too little still
// opens Wallet › Top up.

/** The account's default low-balance limit (users.low_balance_alert). */
export const LOW_BALANCE_CREDITS = 500;

export function LowBalanceBanner({
  estimateMax,
  className,
}: {
  /** The most the typed question may cost, from the composer's estimate. */
  estimateMax?: number | null;
  className?: string;
}) {
  const t = useTranslations("composer.lowBalance");
  const format = useFormatter();
  const { balance } = useMe();
  if (!balance) return null;
  const left = balance.credits;
  const short = estimateMax != null && estimateMax > 0 && left < estimateMax;
  if (!short && left >= LOW_BALANCE_CREDITS) return null;
  const n = (v: number) => format.number(Math.floor(v));
  return (
    <Banner
      tone={short ? "error" : "warning"}
      className={className}
      title={short ? t("shortTitle") : t("lowTitle", { credits: n(left) })}
      body={
        short
          ? t("shortBody", { credits: n(left), max: n(Math.ceil(estimateMax)) })
          : t("lowBody")
      }
      action={
        <Link
          href="/wallet/top-up"
          className={cx(
            "rounded-xs type-ui-strong text-blue hover:underline",
            focusRing,
          )}
        >
          {t("topUp")}
        </Link>
      }
    />
  );
}
