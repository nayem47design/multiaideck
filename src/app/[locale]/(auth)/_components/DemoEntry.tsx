"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/atoms/Button";
import { cx } from "@/components/atoms/states";
import { useRouter } from "@/lib/i18n/navigation";

// Demo deployments only (NEXT_PUBLIC_DEMO_MODE=1, e.g. the Vercel preview): a pill at the top of
// the sign-in screens that signs in as the shared demo account, with scripted answers and the
// sandbox checkout, so people can try MultiAI without an SMS code. Not in Figma: a deployment aid.

export const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "1";

export function DemoEntry({
  next = "/",
  className,
}: {
  next?: string;
  className?: string;
}) {
  const t = useTranslations("auth.demo");
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  if (!DEMO_MODE) return null;

  const enter = async () => {
    setBusy(true);
    setFailed(false);
    try {
      const res = await fetch("/api/dev/sign-in-demo", { method: "POST" });
      if (!res.ok) throw new Error(String(res.status));
      router.replace(next);
      router.refresh();
    } catch {
      setBusy(false);
      setFailed(true);
    }
  };

  return (
    <div
      className={cx(
        "fixed inset-x-4 top-4 z-20 mx-auto flex w-fit max-w-full items-center gap-3 rounded-pill border border-glass-rim glass-strong py-1-5 pr-1-5 pl-4 shadow-prompt-bubble",
        className,
      )}
    >
      <span role="status" className="min-w-0 type-ui text-ink-2">
        {failed ? t("failed") : t("text")}
      </span>
      <Button size="sm" onClick={enter} disabled={busy} className="shrink-0">
        {t("button")}
      </Button>
    </div>
  );
}
