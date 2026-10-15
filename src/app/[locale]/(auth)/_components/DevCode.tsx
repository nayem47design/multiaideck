"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { Banner } from "@/components/molecules/Banner";

// Development only: there's no SMS gateway locally (SMS_PROVIDER=console prints codes to the
// server log), so the code screen shows the code that was "sent". It reads the dev-only
// GET /api/dev/last-code, which answers 404 in production; this component also renders nothing
// in a production build. It never skips the code check: you still type or paste the code.

export function DevCode({
  phone,
  sentAt,
}: {
  phone?: string;
  sentAt?: number | null;
}) {
  const t = useTranslations("auth.code");
  const [code, setCode] = useState<string | null>(null);

  useEffect(() => {
    if (process.env.NODE_ENV !== "development" || !phone) return;
    let live = true;
    fetch(`/api/dev/last-code?phone=${encodeURIComponent(phone)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { code?: string } | null) => {
        if (live) setCode(d?.code ?? null);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [phone, sentAt]);

  if (process.env.NODE_ENV !== "development" || !code) return null;
  return (
    <Banner
      tone="info"
      title={t("devCode", { code })}
      body={t("devCodeBody")}
    />
  );
}
