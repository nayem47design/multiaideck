"use client";

import { useFormatter, useTranslations } from "next-intl";

import { Button } from "@/components/atoms/Button";
import { Icon } from "@/components/atoms/Icon";
import { cx, focusRing, stateLayer } from "@/components/atoms/states";
import { ChecklistCard } from "@/components/molecules/ChecklistCard";
import { ProPriceCard } from "@/components/molecules/ProPriceCard";
import { GoProPanel } from "@/components/organisms/GoProPanel";
import { MobileTopBar } from "@/components/organisms/MobileTopBar";
import { ScreenDialog } from "@/components/organisms/ScreenDialog";
import { PRO_PLAN, wallet } from "@/lib/mock/wallet";

import { useOverlay, type OverlayProps } from "../_shell/overlays";

// Figma: Overlay · Go Pro (desktop dialog) and M37 · Go Pro (mobile full screen). Upgrading pays
// the monthly plan with bKash (simulated) and swaps to "Pro is on", as in the prototype.

export function GoProOverlay({ open, onOpenChange }: OverlayProps) {
  const t = useTranslations("pro");
  const format = useFormatter();
  const { openOverlay } = useOverlay();
  const n = (v: number) => format.number(v);
  const price = t("price", { bdt: n(PRO_PLAN.bdt) });
  const close = () => onOpenChange(false);
  const upgrade = () => {
    wallet.upgradePro();
    openOverlay("pro-on");
  };

  return (
    <ScreenDialog
      open={open}
      onOpenChange={onOpenChange}
      label={t("name")}
      desktop={
        <GoProPanel
          name={t("name")}
          price={price}
          period={t("perMonth")}
          tagline={t("tagline")}
          plans={{
            payg: {
              title: t("payg"),
              features: [
                t("paygFrom", { bdt: n(PRO_PLAN.paygFromBdt) }),
                t("paygNeverExpire"),
                t("paygModels"),
              ],
            },
            pro: {
              title: t("pro"),
              features: [
                t("proCredits", { credits: n(PRO_PLAN.credits) }),
                t("proModels"),
                t("proPriority"),
              ],
            },
          }}
          note={t("note")}
          closeLabel={t("close")}
          notNowLabel={t("notNow")}
          upgradeLabel={t("upgrade", { bdt: n(PRO_PLAN.bdt) })}
          onClose={close}
          onUpgrade={upgrade}
        />
      }
      mobile={
        <>
          <MobileTopBar
            title={t("mobile.title")}
            back={{
              label: t("mobile.back"),
              link: <button type="button" onClick={close} />,
            }}
          />
          <div className="flex flex-1 flex-col gap-go-pro-gap px-mobile-gutter pt-2">
            <ProPriceCard
              name={t("name")}
              price={price}
              period={t("perMonth")}
              tagline={t("tagline")}
            />
            <ChecklistCard
              marker="tick"
              items={[
                t("mobile.benefitCredits", {
                  credits: n(PRO_PLAN.credits),
                  questions: n(PRO_PLAN.questions),
                }),
                t("mobile.benefitModels"),
                t("mobile.benefitReset"),
                t("mobile.benefitPriority"),
              ]}
            />
            <p className="flex items-center gap-2 type-ui text-ink-2">
              <Icon
                name="information-circle"
                className="size-select-icon shrink-0"
              />
              {t("mobile.note")}
            </p>
          </div>
          <div className="flex flex-col items-center gap-2 px-mobile-gutter pt-6 pb-4">
            <Button size="touch-lg" className="w-full" onClick={upgrade}>
              {t("mobile.upgrade")}
            </Button>
            <button
              type="button"
              onClick={close}
              className={cx(
                "flex h-12 w-full items-center justify-center rounded-pill type-m-row-title text-ink",
                stateLayer,
                focusRing,
              )}
            >
              {t("notNow")}
            </button>
          </div>
        </>
      }
    />
  );
}
