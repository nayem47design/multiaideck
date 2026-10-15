import type { ButtonHTMLAttributes, Ref } from "react";

import { Icon } from "@/components/atoms/Icon";
import { cx, focusRing, stateLayer } from "@/components/atoms/states";

// Figma: Prototype › M1 · Welcome & language › Option · English / Option · বাংলা. A radio row:
// selected is lum/blue-soft with a lum/blue stroke and a filled check; unselected is lum/surface
// with an empty circle. Use inside an element with role="radiogroup".

export interface LanguageOptionProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "role"
> {
  selected?: boolean;
  /** BCP 47 tag of the label's language, so Bangla gets its font and voice. */
  lang?: string;
  ref?: Ref<HTMLButtonElement>;
}

export function LanguageOption({
  selected = false,
  lang,
  type = "button",
  className,
  children,
  ref,
  ...props
}: LanguageOptionProps) {
  return (
    <button
      ref={ref}
      type={type}
      role="radio"
      aria-checked={selected}
      className={cx(
        "flex h-language-option-h w-full items-center justify-between gap-3 rounded-language-option px-language-option-pad text-left ring-1 ring-inset",
        "transition-colors duration-fast ease-out",
        stateLayer,
        focusRing,
        selected ? "bg-blue-soft ring-blue" : "bg-surface ring-line",
        className,
      )}
      {...props}
    >
      <span lang={lang} className="type-language-option text-ink">
        {children}
      </span>
      <span
        aria-hidden
        className={cx(
          "flex size-language-check shrink-0 items-center justify-center rounded-pill",
          selected ? "bg-blue text-on-cta" : "ring-1 ring-line ring-inset",
        )}
      >
        {selected && <Icon name="tick-02" className="size-icon-sm" />}
      </span>
    </button>
  );
}
