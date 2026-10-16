"use client";

import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useLayoutEffect, useState, useSyncExternalStore } from "react";

import { cx } from "@/components/atoms/states";
import { MobileTopBar } from "@/components/organisms/MobileTopBar";
import { SignInCard } from "@/components/organisms/SignInCard";
import { api, ApiClientError } from "@/lib/api-client";
import { safeNext } from "@/lib/auth/cookies";
import {
  formatPhone,
  isValidPhone,
  PHONE_PREFIX,
  phoneDigits,
  readFlow,
  retryAfter,
  saveFlow,
} from "@/lib/auth/sign-in-flow";
import { SendCodeResponse } from "@/lib/contracts/auth";
import { Link, useRouter } from "@/lib/i18n/navigation";

import { AuthFrame } from "./AuthFrame";
import { DemoEntry } from "./DemoEntry";
import { useClock, useCountdown } from "./useCountdown";
import { Welcome } from "./Welcome";

// /sign-in. Desktop: Desktop · Sign in. Mobile: M1 · Welcome & language, then M16 · Sign in: phone
// number (?step=phone). Send code → POST /api/auth/code → Enter code; Continue with Google →
// /api/auth/google (or a friendly message when Google isn't set up). ?next= is where to go after
// signing in; ?error=google… comes back from a failed Google sign-in.

export type SignInStep = "welcome" | "phone";

const GOOGLE_ERRORS = ["google", "google_cancelled", "google_not_configured"];

/** Reads ?step=, ?next= and ?error= (wrap in <Suspense>; the fallback renders the welcome step). */
export function SignInFromParams() {
  const params = useSearchParams();
  const error = params.get("error");
  const googleError = GOOGLE_ERRORS.includes(error ?? "") ? error! : undefined;
  const step =
    params.get("step") === "phone" || googleError ? "phone" : "welcome";
  return (
    <SignInScreen
      step={step}
      next={safeNext(params.get("next"))}
      googleError={googleError}
    />
  );
}

type Problem =
  | { key: "invalid" | "network" | "generic" | GoogleProblem }
  | { key: "rateLimited" | "resendWait" | "locked"; until: number };
type GoogleProblem = "google" | "googleCancelled" | "googleNotConfigured";

const googleKey = (e: string): GoogleProblem =>
  e === "google_cancelled"
    ? "googleCancelled"
    : e === "google_not_configured"
      ? "googleNotConfigured"
      : "google";

const noop = () => () => {};
const savedPhone = () => formatPhone(readFlow()?.phone ?? "");

export function SignInScreen({
  step,
  next = "/",
  googleError,
}: {
  step: SignInStep;
  next?: string;
  googleError?: string;
}) {
  const t = useTranslations("auth.phone");
  const te = useTranslations("auth.errors");
  const locale = useLocale();
  const router = useRouter();
  const clock = useClock();
  // The number from an earlier attempt in this tab, if any (sessionStorage).
  const saved = useSyncExternalStore(noop, savedPhone, () => "");
  const [typed, setTyped] = useState<string>();
  const phone = typed ?? saved;
  const [problem, setProblem] = useState<Problem | undefined>(
    googleError ? { key: googleKey(googleError) } : undefined,
  );
  const [sending, setSending] = useState(false);
  // Pages stay mounted (hidden) after navigation; coming back must not find it still sending.
  useLayoutEffect(() => () => setSending(false), []);
  const waitFor = useCountdown(
    problem && "until" in problem ? problem.until : null,
  );

  const error = !problem
    ? undefined
    : problem.key === "invalid"
      ? t("invalid")
      : "until" in problem
        ? waitFor > 0
          ? te(problem.key, { time: clock(waitFor) })
          : undefined
        : te(problem.key);

  const send = async () => {
    if (!isValidPhone(phone)) {
      setProblem({ key: "invalid" });
      return;
    }
    setSending(true);
    setProblem(undefined);
    try {
      const sent = await api("/api/auth/code", {
        method: "POST",
        body: { phone: phoneDigits(phone), locale },
        schema: SendCodeResponse,
      });
      saveFlow({
        phone: phoneDigits(phone),
        resendAt: Date.now() + sent.resendIn * 1000,
        next,
      });
      router.push("/sign-in/code");
    } catch (e) {
      setSending(false);
      if (!(e instanceof ApiClientError)) return setProblem({ key: "network" });
      const until = Date.now() + retryAfter(e) * 1000;
      if (e.code === "invalid_input") setProblem({ key: "invalid" });
      else if (e.code === "locked") setProblem({ key: "locked", until });
      else if (e.code === "rate_limited")
        setProblem({
          key: e.details?.limit === "resend" ? "resendWait" : "rateLimited",
          until,
        });
      else setProblem({ key: "generic" });
    }
  };

  const google = async () => {
    setProblem(undefined);
    try {
      const res = await fetch("/api/auth/google?check=1");
      if (res.status === 503) return setProblem({ key: "googleNotConfigured" });
      if (!res.ok) return setProblem({ key: "google" });
      // A route handler that redirects to Google, not a page.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      location.assign(
        `/api/auth/google?${new URLSearchParams({ next, locale })}`,
      );
    } catch {
      setProblem({ key: "network" });
    }
  };

  return (
    <AuthFrame>
      <DemoEntry next={next} />
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
            setTyped(formatPhone(v));
            if (problem && !("until" in problem)) setProblem(undefined);
          }}
          onSend={send}
          onGoogle={google}
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
