"use client";

import { useFormatter, useTranslations } from "next-intl";

import { Button } from "@/components/atoms/Button";
import { ResultHero } from "@/components/molecules/ResultHero";
import { ScreenDialog } from "@/components/organisms/ScreenDialog";
import { useRouter } from "@/lib/i18n/navigation";
import { useMe } from "@/lib/me";
import { PRO_PLAN } from "@/lib/payments/client";

import type { OverlayProps } from "../_shell/overlays";

// Figma: Overlay · Pro is on (desktop dialog) and M38 · Pro is on (mobile full screen). The next
// payment date is the plan's renewal date from the server (users.pro_renews_at).

export function ProOnOverlay({ open, onOpenChange }: OverlayProps) {
  const t = useTranslations("pro.on");
  const format = useFormatter();
  const router = useRouter();
  const { user } = useMe();
  const renews = user?.proRenewsAt;
  const params = {
    credits: format.number(PRO_PLAN.credits),
    bdt: format.number(PRO_PLAN.bdt),
    date: renews
      ? format.dateTime(new Date(renews), {
          month: "short",
          day: "numeric",
          timeZone: "Asia/Dhaka",
        })
      : "",
  };
  const go = (href: "/" | "/wallet") => {
    onOpenChange(false);
    router.push(href);
  };

  return (
    <ScreenDialog
      open={open}
      onOpenChange={onOpenChange}
      label={t("title")}
      desktop={
        <div className="flex w-dialog-sm-width max-w-full flex-col items-center gap-go-pro-gap rounded-xl border border-line bg-surface p-go-pro-pad shadow-dialog">
          <ResultHero
            tone="pro"
            size="md"
            as="h2"
            title={t("title")}
            body={t("body", params)}
          />
          <div className="flex w-full flex-col gap-go-pro-gap">
            <Button size="lg" className="w-full" onClick={() => go("/")}>
              {t("startAsking")}
            </Button>
            <Button
              variant="secondary"
              size="lg"
              className="w-full"
              onClick={() => go("/wallet")}
            >
              {t("viewInWallet")}
            </Button>
          </div>
        </div>
      }
      mobile={
        <div className="flex flex-1 flex-col px-mobile-gutter pb-4">
          <ResultHero
            tone="pro"
            title={t("title")}
            body={t("bodyMobile", params)}
            className="pt-m-hero-top"
          />
          <span className="flex-1" />
          <Button
            size="touch-lg"
            className="mt-6 w-full"
            onClick={() => go("/")}
          >
            {t("startAsking")}
          </Button>
        </div>
      }
    />
  );
}
