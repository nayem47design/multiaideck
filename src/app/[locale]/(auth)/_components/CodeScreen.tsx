"use client";

import { useFormatter, useLocale, useTranslations } from "next-intl";
import { useEffect, useState, useSyncExternalStore } from "react";

import { CodeCard } from "@/components/organisms/CodeCard";
import { MobileTopBar } from "@/components/organisms/MobileTopBar";
import { api, ApiClientError } from "@/lib/api-client";
import {
  clearFlow,
  CODE_LENGTH,
  FLOW_KEY,
  formatPhone,
  localePath,
  PHONE_PREFIX,
  readFlow,
  retryAfter,
  saveFlow,
  type SignInFlow,
} from "@/lib/auth/sign-in-flow";
import { MeResponse, SendCodeResponse } from "@/lib/contracts/auth";
import { Link, useRouter } from "@/lib/i18n/navigation";

import { AuthFrame } from "./AuthFrame";
import { DevCode } from "./DevCode";
import { useClock, useCountdown } from "./useCountdown";

// /sign-in/code. Desktop: Desktop · Enter code; mobile: M17 · Enter the code. Verify and continue →
// POST /api/auth/verify → the page the user wanted (in their saved language); Wrong number? Change
// it → Sign in (the phone step on mobile). The number comes from /sign-in through sessionStorage.

const PHONE_STEP = "/sign-in?step=phone";

type Problem =
  | { key: "wrongCode"; count: number }
  | { key: "wrongCodeLast" | "expired" | "network" | "generic" }
  | { key: "locked" | "rateLimited" | "resendWait"; until: number };

// sessionStorage, read after hydration (the server renders an empty number).
let cached: { raw: string | null; flow: SignInFlow | null } = {
  raw: null,
  flow: null,
};
const noop = () => () => {};
function snapshot() {
  let raw: string | null = null;
  try {
    raw = sessionStorage.getItem(FLOW_KEY);
  } catch {}
  if (raw !== cached.raw) cached = { raw, flow: readFlow() };
  return cached.flow;
}

export function CodeScreen() {
  const t = useTranslations("auth.code");
  const te = useTranslations("auth.errors");
  const format = useFormatter();
  const locale = useLocale();
  const router = useRouter();
  const clock = useClock();
  const stored = useSyncExternalStore(noop, snapshot, () => null);
  const [resendAt, setResendAt] = useState<number | null>(null);
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [problem, setProblem] = useState<Problem>();
  const flow = stored;
  const resendIn = useCountdown(resendAt ?? flow?.resendAt ?? null);
  const waitFor = useCountdown(
    problem && "until" in problem ? problem.until : null,
  );

  // Opened without a number (new tab, refreshed after signing in): back to the phone step.
  const missing = useSyncExternalStore(
    noop,
    () => snapshot() === null,
    () => false,
  );
  useEffect(() => {
    if (missing) router.replace(PHONE_STEP);
  }, [missing, router]);

  const fail = (e: unknown) => {
    if (!(e instanceof ApiClientError)) return setProblem({ key: "network" });
    const until = Date.now() + retryAfter(e) * 1000;
    if (e.code === "code_invalid") {
      const left = Number(e.details?.attemptsLeft ?? 0);
      setProblem(
        left > 0 ? { key: "wrongCode", count: left } : { key: "wrongCodeLast" },
      );
    } else if (e.code === "code_expired") setProblem({ key: "expired" });
    else if (e.code === "locked") setProblem({ key: "locked", until });
    else if (e.code === "rate_limited")
      setProblem({
        key: e.details?.limit === "resend" ? "resendWait" : "rateLimited",
        until,
      });
    else setProblem({ key: "generic" });
  };

  const verify = async () => {
    if (!flow) return;
    setVerifying(true);
    setProblem(undefined);
    try {
      const me = await api("/api/auth/verify", {
        method: "POST",
        body: { phone: flow.phone, code, locale },
        schema: MeResponse,
      });
      clearFlow();
      // A returning user continues in their saved language; a new one in this one.
      const target = me.isNew ? locale : me.user.locale;
      // A full page load, so the app starts fresh with the new session.
      location.assign(localePath(flow.next, target));
    } catch (e) {
      setVerifying(false);
      setCode("");
      fail(e);
    }
  };

  const resend = async () => {
    if (!flow) return;
    setCode("");
    setProblem(undefined);
    try {
      const sent = await api("/api/auth/code", {
        method: "POST",
        body: { phone: flow.phone, locale },
        schema: SendCodeResponse,
      });
      const at = Date.now() + sent.resendIn * 1000;
      saveFlow({ ...flow, resendAt: at });
      setResendAt(at);
    } catch (e) {
      fail(e);
      if (e instanceof ApiClientError && e.code === "rate_limited")
        setResendAt(Date.now() + retryAfter(e) * 1000);
    }
  };

  const error = !problem
    ? undefined
    : problem.key === "wrongCode"
      ? te("wrongCode", { count: problem.count })
      : "until" in problem
        ? waitFor > 0
          ? te(problem.key, { time: clock(waitFor) })
          : undefined
        : te(problem.key);

  return (
    <AuthFrame>
      <div className="flex min-h-dvh flex-1 flex-col md:min-h-0 md:flex-none">
        <MobileTopBar
          className="md:hidden"
          title=""
          back={{ label: t("back"), link: <Link href={PHONE_STEP} /> }}
        />
        <div className="px-4 pt-4 md:w-auth-card-w md:max-w-full md:px-0 md:pt-0 md:pb-4">
          <DevCode phone={flow?.phone} sentAt={resendAt ?? flow?.resendAt} />
        </div>
        <CodeCard
          className="max-md:flex-1 max-md:px-4 max-md:pt-4 max-md:pb-8"
          code={code}
          onCodeChange={(v) => {
            setCode(v);
            if (problem && !("until" in problem)) setProblem(undefined);
          }}
          onVerify={verify}
          verifying={verifying}
          error={error}
          length={CODE_LENGTH}
          resendIn={resendIn}
          onResend={resend}
          changeLink={<Link href={PHONE_STEP} />}
          labels={{
            title: t("title"),
            sentTo: t("sentTo", {
              phone: `${PHONE_PREFIX} ${formatPhone(flow?.phone ?? "")}`,
            }),
            code: t("label"),
            digit: (position) =>
              t("digit", { position: format.number(position) }),
            resendIn: t("resendIn", { time: clock(resendIn) }),
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
