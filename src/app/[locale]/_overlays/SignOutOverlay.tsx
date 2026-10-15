"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useState } from "react";

import { SignOutPrompt } from "@/components/organisms/SignOutPrompt";
import { useRouter } from "@/lib/i18n/navigation";
import { DEMO_BALANCE } from "@/lib/mock/demo";

import type { OverlayProps } from "../_shell/overlays";

// Figma: "Overlay · Sign out" (166:28826); below 768px M43 · Sign out? (a bottom sheet). Opened
// with useOverlay().openOverlay("sign-out") from the sidebar's account menu and Settings.

export function SignOutOverlay({ open, onOpenChange }: OverlayProps) {
  const t = useTranslations("account.signOutPrompt");
  const format = useFormatter();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  return (
    <SignOutPrompt
      open={open}
      onOpenChange={(next) => {
        if (next) setSigningOut(false);
        onOpenChange(next);
      }}
      title={t("title")}
      body={t("body", { credits: format.number(DEMO_BALANCE.credits) })}
      stayLabel={t("stay")}
      signOutLabel={t("confirm")}
      signingOut={signingOut}
      onSignOut={() => {
        setSigningOut(true);
        // Close first: pages stay mounted (hidden) after navigation, but this dialog's portal would
        // stay on screen. The demo has no session to end yet (Phase 6).
        onOpenChange(false);
        router.replace("/sign-in");
      }}
    />
  );
}
