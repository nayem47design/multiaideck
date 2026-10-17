"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { cx } from "@/components/atoms/states";
import { AuthPromise } from "@/components/organisms/AuthPromise";

// The sign-in screens' layout. ≥ 1024px: the promise on the left, the card on the right (Figma:
// Desktop · Sign in / Enter code). 768–1023px: the card alone, centred. Below 768px: the M-screen,
// full height (top bar, content, buttons at the bottom).

export function AuthFrame({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const t = useTranslations("auth.promise");
  return (
    <main
      className={cx(
        "mx-auto flex min-h-dvh w-full max-w-screen-desktop flex-col",
        "md:items-center md:justify-center md:gap-10 md:px-8 lg:flex-row lg:justify-between lg:gap-8 xl:px-auth-pad",
        className,
      )}
    >
      <AuthPromise
        className="min-w-0 shrink max-md:hidden md:max-lg:w-auth-card-w md:max-lg:[&_ul]:hidden"
        title={t("title")}
        body={t("body")}
        points={[
          t("points.noSubscription"),
          t("points.neverExpire"),
          t("points.notCharged"),
        ]}
      />
      {children}
    </main>
  );
}
