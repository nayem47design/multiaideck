"use client";

import { cloneElement, type FormEvent, type ReactElement } from "react";

import { Button } from "@/components/atoms/Button";
import { Icon } from "@/components/atoms/Icon";
import { cx, focusRing } from "@/components/atoms/states";
import { CodeInput } from "@/components/molecules/CodeInput";

// Figma: Prototype › Desktop · Enter code › Code card and M17 · Enter the code (below 768px: no
// card, larger title, "Wrong number?" and "Verify and continue" at the bottom of the screen).
// The resend line counts down; at zero it becomes a "Resend code" button (not in Figma).

export interface CodeCardProps {
  code: string;
  onCodeChange: (code: string) => void;
  onVerify: () => void;
  /** Seconds until the code can be sent again; 0 shows the resend button. */
  resendIn: number;
  onResend: () => void;
  verifying?: boolean;
  error?: string;
  length?: number;
  /** "Wrong number? Change it": an empty link element, e.g. <Link href="/sign-in" />. */
  changeLink: ReactElement<{ className?: string }>;
  labels: {
    title: string;
    /** "Sent by SMS to +880 1712 345 214". */
    sentTo: string;
    code: string;
    digit: (position: number) => string;
    /** "Resend code in 0:42". */
    resendIn: string;
    resend: string;
    /** "The code fills in by itself on most phones." (mobile). */
    autoFill: string;
    verify: string;
    change: string;
  };
  className?: string;
}

export function CodeCard({
  code,
  onCodeChange,
  onVerify,
  resendIn,
  onResend,
  verifying = false,
  error,
  length = 6,
  changeLink,
  labels,
  className,
}: CodeCardProps) {
  const complete = code.length === length;
  const submit = (e?: FormEvent) => {
    e?.preventDefault();
    if (complete && !verifying) onVerify();
  };
  const change = cloneElement(
    changeLink,
    {
      className: cx(
        "self-start rounded-xs text-blue underline-offset-2 hover:underline",
        "md:type-ui-strong max-md:type-auth-link-mobile",
        focusRing,
      ),
    },
    labels.change,
  );
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
          {labels.title}
        </h2>
        <p className="text-ink-2 max-md:type-body md:type-ui">
          {labels.sentTo}
        </p>
        <CodeInput
          value={code}
          onChange={onCodeChange}
          length={length}
          label={labels.code}
          digitLabel={labels.digit}
          invalid={!!error}
          disabled={verifying}
          autoFocus
        />
        {error && (
          <p role="alert" className="type-ui text-error">
            {error}
          </p>
        )}
        <p className="flex items-center gap-1-5 type-ui text-ink-2">
          <Icon name="clock-01" className="size-icon-sm" />
          {resendIn > 0 ? (
            <span aria-live="off">{labels.resendIn}</span>
          ) : (
            <button
              type="button"
              onClick={onResend}
              className={cx(
                "rounded-xs type-ui-strong text-blue hover:underline",
                focusRing,
              )}
            >
              {labels.resend}
            </button>
          )}
        </p>
        <p className="type-ui text-ink-2 md:hidden">{labels.autoFill}</p>
      </div>
      <div className="flex flex-col gap-4 max-md:mt-auto max-md:flex-col-reverse">
        <Button
          type="submit"
          loading={verifying}
          disabled={!complete}
          className="h-auth-button-h! w-full type-auth-button! max-md:h-auth-button-h-mobile! max-md:type-auth-button-mobile!"
        >
          {labels.verify}
        </Button>
        {change}
      </div>
    </form>
  );
}
