"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/atoms/Button";
import { Icon } from "@/components/atoms/Icon";
import { cx, focusRing, stateLayer } from "@/components/atoms/states";
import { ChecklistCard } from "@/components/molecules/ChecklistCard";
import { ProPriceCard } from "@/components/molecules/ProPriceCard";
import { GoProPanel } from "@/components/organisms/GoProPanel";
import { MobileTopBar } from "@/components/organisms/MobileTopBar";
import { ScreenDialog } from "@/components/organisms/ScreenDialog";
import { PRO_PLAN, walletActions } from "@/lib/payments/client";

import { useOverlay, type OverlayProps } from "../_shell/overlays";

// Figma: Overlay · Go Pro (desktop dialog) and M37 · Go Pro (mobile full screen). Upgrading starts
// a Pro payment on the server (POST /api/payments { kind: "pro" }, bKash). With PayStation the
// person goes to its checkout and comes back to /wallet/paid, which opens "Pro is on". With the
// sandbox (no PayStation keys) the payment is approved right away, as in the prototype, and
// "Pro is on" opens here. The server sets the plan and adds the credits once the payment is paid.

export function GoProOverlay({ open, onOpenChange }: OverlayProps) {
  const t = useTranslations("pro");
  const format = useFormatter();
  const { openOverlay } = useOverlay();
  const n = (v: number) => format.number(v);
  const price = t("price", { bdt: n(PRO_PLAN.bdt) });
  const close = () => onOpenChange(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const upgrade = async () => {
    if (busy) return;
    setBusy(true);
    setFailed(false);
    try {
      const { payment, redirectUrl } = await walletActions.start({
        kind: "pro",
      });
      if (payment.provider !== "sandbox") {
        window.location.assign(redirectUrl);
        return;
      }
      const paid = await walletActions.decide(payment.id, "paid");
      if (paid.status === "paid") openOverlay("pro-on");
      else setFailed(true);
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
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
          note={failed ? t("startFailed") : t("note")}
          closeLabel={t("close")}
          notNowLabel={t("notNow")}
          upgradeLabel={t("upgrade", { bdt: n(PRO_PLAN.bdt) })}
          onClose={close}
          onUpgrade={() => void upgrade()}
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
              {failed ? t("startFailed") : t("mobile.note")}
            </p>
          </div>
          <div className="flex flex-col items-center gap-2 px-mobile-gutter pt-6 pb-4">
            <Button
              size="touch-lg"
              className="w-full"
              loading={busy}
              onClick={() => void upgrade()}
            >
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
