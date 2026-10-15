"use client";

import { useFormatter, useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import { SignOutPrompt } from "@/components/organisms/SignOutPrompt";
import { api } from "@/lib/api-client";
import { getPathname } from "@/lib/i18n/navigation";
import { me, useMe } from "@/lib/me";

import type { OverlayProps } from "../_shell/overlays";

// Figma: "Overlay · Sign out" (166:28826); below 768px M43 · Sign out? (a bottom sheet). Opened
// with useOverlay().openOverlay("sign-out") from the sidebar's account menu and Settings.

export function SignOutOverlay({ open, onOpenChange }: OverlayProps) {
  const t = useTranslations("account.signOutPrompt");
  const format = useFormatter();
  const locale = useLocale();
  const { balance } = useMe();
  const [signingOut, setSigningOut] = useState(false);

  return (
    <SignOutPrompt
      open={open}
      onOpenChange={(next) => {
        if (next) setSigningOut(false);
        onOpenChange(next);
      }}
      title={t("title")}
      body={t("body", {
        credits: format.number(Math.floor(balance?.credits ?? 0)),
      })}
      stayLabel={t("stay")}
      signOutLabel={t("confirm")}
      signingOut={signingOut}
      onSignOut={async () => {
        setSigningOut(true);
        // End the session, then a full page load so no state of this user stays in memory. (If
        // the request failed, the cookie is still there and the proxy sends the browser home.)
        await api("/api/auth/sign-out", { method: "POST" }).catch(() => {});
        me.clear();
        location.replace(getPathname({ href: "/sign-in", locale }));
      }}
    />
  );
}
