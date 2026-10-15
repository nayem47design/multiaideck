"use client";

import type { FormEvent, ReactNode } from "react";

import { Button } from "@/components/atoms/Button";
import { Divider } from "@/components/atoms/Divider";
import { cx } from "@/components/atoms/states";
import { PhoneInput } from "@/components/molecules/PhoneInput";

// Figma: Prototype › Desktop · Sign in › Sign in card (440px card) and M16 · Sign in: phone number
// (below 768px: no card, a larger title, the buttons at the bottom of the screen). Phone with
// +880, "Send code", "or", "Continue with Google" (Figma draws the mail icon) and the terms line.

export interface SignInCardProps {
  phone: string;
  onPhoneChange: (phone: string) => void;
  onSend: () => void;
  onGoogle: () => void;
  sending?: boolean;
  /** Shown under the phone field (replaces the mobile help line). */
  error?: string;
  labels: {
    title: string;
    mobileTitle: string;
    subtitle: string;
    mobileSubtitle: string;
    /** Accessible name of the number field. */
    phone: string;
    /** "Mobile number (Bangladesh)", under the field on mobile. */
    phoneHelp: string;
    placeholder: string;
    prefix: string;
    country: string;
    send: string;
    or: string;
    google: string;
    terms: ReactNode;
  };
  className?: string;
}

const button = (mobileHeight: string) =>
  cx(
    "w-full h-auth-button-h! type-auth-button! max-md:type-auth-button-mobile!",
    mobileHeight,
  );

export function SignInCard({
  phone,
  onPhoneChange,
  onSend,
  onGoogle,
  sending = false,
  error,
  labels,
  className,
}: SignInCardProps) {
  const submit = (e: FormEvent) => {
    e.preventDefault();
    onSend();
  };
  return (
    <form
      onSubmit={submit}
      noValidate
      className={cx(
        "flex flex-col gap-4",
        "md:w-auth-card-w md:rounded-xl md:bg-surface md:p-auth-card-pad md:ring-1 md:ring-line md:ring-inset",
        className,
      )}
    >
      <div className="flex flex-col gap-4">
        <h2 className="text-ink max-md:type-auth-mobile-title md:type-auth-card-title">
          <span className="max-md:hidden">{labels.title}</span>
          <span className="md:hidden">{labels.mobileTitle}</span>
        </h2>
        <p className="text-ink-2 max-md:type-body md:type-ui">
          <span className="max-md:hidden">{labels.subtitle}</span>
          <span className="md:hidden">{labels.mobileSubtitle}</span>
        </p>
        <PhoneInput
          prefix={labels.prefix}
          countryLabel={labels.country}
          aria-label={labels.phone}
          aria-describedby="sign-in-phone-help"
          placeholder={labels.placeholder}
          value={phone}
          onChange={(e) => onPhoneChange(e.target.value)}
          invalid={!!error}
          readOnly={sending}
          autoFocus
        />
        <p
          id="sign-in-phone-help"
          aria-live="polite"
          className={cx(
            "type-ui",
            error ? "text-error" : "text-ink-2 md:hidden",
          )}
        >
          {error ?? labels.phoneHelp}
        </p>
      </div>
      <div className="flex flex-col gap-4 max-md:mt-auto max-md:gap-3">
        <Button
          type="submit"
          loading={sending}
          className={button("max-md:h-auth-button-h-mobile!")}
        >
          {labels.send}
        </Button>
        <div className="flex items-center gap-auth-or-gap max-md:justify-center">
          <Divider className="flex-1 max-md:hidden" />
          <span className="type-ui text-ink-2">{labels.or}</span>
          <Divider className="flex-1 max-md:hidden" />
        </div>
        <Button
          variant="secondary"
          icon="mail-01"
          onClick={onGoogle}
          disabled={sending}
          className={button("max-md:h-auth-google-h-mobile!")}
        >
          {labels.google}
        </Button>
        <p className="type-caption text-ink-2 max-md:text-center">
          {labels.terms}
        </p>
      </div>
    </form>
  );
}
