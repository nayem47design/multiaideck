"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";

import { Button } from "@/components/atoms/Button";
import { LightField } from "@/components/atoms/LightField";
import { EmptyState } from "@/components/molecules/EmptyState";

// Not in Figma yet (07 · Gaps › Offline and server errors, P1): when a page fails to render or
// load, a full-page Empty state (Tone=Error) with "Try again", like 404.

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("common.crash");
  const tc = useTranslations("common");
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <main className="relative isolate flex min-h-dvh items-center justify-center bg-canvas p-shell-pad">
      <LightField variant="page" fixed />
      <EmptyState
        tone="error"
        title={t("title")}
        body={t("body")}
        action={
          <Button variant="secondary" size="sm" onClick={reset}>
            {tc("tryAgain")}
          </Button>
        }
      />
    </main>
  );
}
