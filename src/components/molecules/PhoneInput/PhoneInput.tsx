import type { InputHTMLAttributes, Ref } from "react";

import { Icon } from "@/components/atoms/Icon";
import { cx } from "@/components/atoms/states";

// Figma: Prototype › Desktop · Sign in › Sign in card › Phone field, and M16 › Phone field (taller,
// below 768px). The country chip shows the only supported country (Bangladesh, +880). Figma draws
// the focused state (lum/blue stroke); the resting lum/line stroke is built from tokens.

export interface PhoneInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "prefix"
> {
  /** e.g. "+880". */
  prefix: string;
  /** Accessible name of the country chip, e.g. "Bangladesh". */
  countryLabel: string;
  invalid?: boolean;
  ref?: Ref<HTMLInputElement>;
}

export function PhoneInput({
  prefix,
  countryLabel,
  invalid,
  className,
  ref,
  ...props
}: PhoneInputProps) {
  return (
    <label
      className={cx(
        "flex w-full items-center gap-auth-phone-gap bg-surface",
        "h-auth-phone-h rounded-auth-phone px-3 max-md:h-auth-phone-h-mobile max-md:rounded-auth-phone-mobile max-md:px-auth-phone-pad-mobile",
        "transition-shadow duration-fast ease-out ring-inset",
        invalid
          ? "ring-(length:--input-border-focus-width) ring-error"
          : "ring-(length:--input-border-width) ring-line focus-within:ring-(length:--input-border-focus-width) focus-within:ring-blue",
        "has-disabled:bg-canvas",
        className,
      )}
    >
      <span
        title={countryLabel}
        className={cx(
          "flex shrink-0 items-center gap-1 bg-canvas px-auth-country-pad text-ink",
          "h-auth-country-h rounded-auth-country type-auth-country",
          "max-md:h-auth-country-h-mobile max-md:rounded-auth-country-mobile max-md:type-auth-country-mobile",
        )}
      >
        <span className="sr-only">{countryLabel}</span>
        {prefix}
        <Icon
          name="arrow-down-01"
          className="size-select-icon text-ink-2 max-md:size-icon-sm"
        />
      </span>
      <input
        ref={ref}
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        aria-invalid={invalid || undefined}
        className="min-w-0 flex-1 bg-transparent type-auth-phone text-ink outline-none placeholder:text-ink-3 max-md:type-auth-phone-mobile"
        {...props}
      />
    </label>
  );
}
