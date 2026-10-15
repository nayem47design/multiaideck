import { cloneElement, type ReactElement } from "react";

import { cx, focusRing } from "@/components/atoms/states";

// Not a Figma component yet: "Language switch" at the top of M2 · Home (EN / বাং). Each option
// is a link to the same page in that language.

export interface LanguageSwitchOption {
  /** e.g. "EN", "বাং". */
  label: string;
  /** Full name for screen readers, e.g. "English". */
  name: string;
  /** An empty link element to this page in that language. */
  link: ReactElement<{ className?: string; lang?: string }>;
  selected?: boolean;
  lang: string;
}

export interface LanguageSwitchProps {
  /** Accessible name, e.g. "Language". */
  label: string;
  options: LanguageSwitchOption[];
  className?: string;
}

export function LanguageSwitch({
  label,
  options,
  className,
}: LanguageSwitchProps) {
  return (
    <nav
      aria-label={label}
      className={cx(
        "inline-flex h-10 items-center rounded-pill border border-line bg-surface p-chat-m-switch-pad",
        className,
      )}
    >
      {options.map((o) =>
        cloneElement(
          o.link,
          {
            key: o.lang,
            lang: o.lang,
            "aria-current": o.selected ? "true" : undefined,
            "aria-label": o.name,
            className: cx(
              "inline-flex h-full items-center rounded-pill px-3 type-ui-strong",
              o.selected
                ? "bg-blue-soft text-blue"
                : "text-ink-2 hover:text-ink",
              focusRing,
            ),
          } as { className: string },
          o.label,
        ),
      )}
    </nav>
  );
}
