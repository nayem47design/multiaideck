"use client";

import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

import { cx } from "@/components/atoms/states";
import { MobileTopBar } from "@/components/organisms/MobileTopBar";
import { SignInCard } from "@/components/organisms/SignInCard";
import { Link, useRouter } from "@/lib/i18n/navigation";
import {
  formatPhone,
  isValidPhone,
  PHONE_PREFIX,
  savePhone,
} from "@/lib/mock/auth";
import { DEMO_USER } from "@/lib/mock/demo";

import { AuthFrame } from "./AuthFrame";
import { Welcome } from "./Welcome";

// /sign-in. Desktop: Desktop · Sign in. Mobile: M1 · Welcome & language, then M16 · Sign in: phone
// number (?step=phone). Prototype: Send code → Enter code; Continue with Google → Home.

export type SignInStep = "welcome" | "phone";

/** Reads ?step= (wrap in <Suspense>; the fallback renders the welcome step). */
export function SignInFromParams() {
  const step = useSearchParams().get("step") === "phone" ? "phone" : "welcome";
  return <SignInScreen step={step} />;
}

export function SignInScreen({ step }: { step: SignInStep }) {
  const t = useTranslations("auth.phone");
  const router = useRouter();
  // Demo: prefilled with the prototype's number, as in Figma.
  const [phone, setPhone] = useState(formatPhone(DEMO_USER.phone));
  const [error, setError] = useState<string>();
  const [sending, setSending] = useState(false);

  const send = () => {
    if (!isValidPhone(phone)) {
      setError(t("invalid"));
      return;
    }
    savePhone(phone);
    setSending(true);
    // Demo: the SMS provider is wired in Phase 6.
    setTimeout(() => router.push("/sign-in/code"), 600);
  };

  return (
    <AuthFrame>
      {step === "welcome" && <Welcome className="md:hidden" />}
      <div
        className={cx(
          "flex min-h-dvh flex-1 flex-col md:min-h-0 md:flex-none",
          step === "welcome" && "max-md:hidden",
        )}
      >
        <MobileTopBar
          className="md:hidden"
          title=""
          back={{ label: t("back"), link: <Link href="/sign-in" /> }}
        />
        <SignInCard
          className="max-md:flex-1 max-md:px-4 max-md:pt-4 max-md:pb-6"
          phone={phone}
          onPhoneChange={(v) => {
            setPhone(formatPhone(v));
            setError(undefined);
          }}
          onSend={send}
          onGoogle={() => router.push("/")}
          sending={sending}
          error={error}
          labels={{
            title: t("title"),
            mobileTitle: t("mobileTitle"),
            subtitle: t("subtitle"),
            mobileSubtitle: t("mobileSubtitle"),
            phone: t("label"),
            phoneHelp: t("help"),
            placeholder: t("placeholder"),
            prefix: PHONE_PREFIX,
            country: t("country"),
            send: t("send"),
            or: t("or"),
            google: t("google"),
            terms: t("terms"),
          }}
        />
      </div>
    </AuthFrame>
  );
}
