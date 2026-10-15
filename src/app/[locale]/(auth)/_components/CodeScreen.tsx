"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useEffect, useState, useSyncExternalStore } from "react";

import { CodeCard } from "@/components/organisms/CodeCard";
import { MobileTopBar } from "@/components/organisms/MobileTopBar";
import { Link, useRouter } from "@/lib/i18n/navigation";
import {
  CODE_LENGTH,
  formatPhone,
  PHONE_PREFIX,
  readPhone,
  RESEND_SECONDS,
} from "@/lib/mock/auth";
import { DEMO_USER } from "@/lib/mock/demo";

import { AuthFrame } from "./AuthFrame";

// /sign-in/code. Desktop: Desktop · Enter code; mobile: M17 · Enter the code. Prototype: Verify and
// continue → Home; Wrong number? Change it → Sign in (the phone step on mobile).

const PHONE_STEP = "/sign-in?step=phone";
const noop = () => () => {};

export function CodeScreen() {
  const t = useTranslations("auth.code");
  const format = useFormatter();
  const router = useRouter();
  // The number typed on /sign-in (sessionStorage); the demo number before hydration.
  const phone = useSyncExternalStore(noop, readPhone, () => DEMO_USER.phone);
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resendAt, setResendAt] = useState(RESEND_SECONDS);

  useEffect(() => {
    if (resendAt <= 0) return;
    const id = setTimeout(() => setResendAt((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [resendAt]);

  const verify = () => {
    setVerifying(true);
    // Demo: any 6 digits sign you in; the SMS check lands in Phase 6.
    setTimeout(() => router.push("/"), 800);
  };

  const time = `${format.number(Math.floor(resendAt / 60))}:${format.number(
    resendAt % 60,
    { minimumIntegerDigits: 2 },
  )}`;

  return (
    <AuthFrame>
      <div className="flex min-h-dvh flex-1 flex-col md:min-h-0 md:flex-none">
        <MobileTopBar
          className="md:hidden"
          title=""
          back={{ label: t("back"), link: <Link href={PHONE_STEP} /> }}
        />
        <CodeCard
          className="max-md:flex-1 max-md:px-4 max-md:pt-4 max-md:pb-8"
          code={code}
          onCodeChange={setCode}
          onVerify={verify}
          verifying={verifying}
          length={CODE_LENGTH}
          resendIn={resendAt}
          onResend={() => {
            setCode("");
            setResendAt(RESEND_SECONDS);
          }}
          changeLink={<Link href={PHONE_STEP} />}
          labels={{
            title: t("title"),
            sentTo: t("sentTo", {
              phone: `${PHONE_PREFIX} ${formatPhone(phone)}`,
            }),
            code: t("label"),
            digit: (position) =>
              t("digit", { position: format.number(position) }),
            resendIn: t("resendIn", { time }),
            resend: t("resend"),
            autoFill: t("autoFill"),
            verify: t("verify"),
            change: t("change"),
          }}
        />
      </div>
    </AuthFrame>
  );
}
