import type { ReactNode } from "react";

import { Icon } from "@/components/atoms/Icon";
import { cx } from "@/components/atoms/states";

// Figma: the centred result block of M12 · Payment received ("Success"), M35 · Payment didn't go
// through ("Failed"), M38 · Pro is on and Overlay · Pro is on: a round icon, a light title and a
// line of body text. M34 passes its own visual (the payment logo).

export type ResultHeroTone = "success" | "error" | "pro";

export interface ResultHeroProps {
  tone: ResultHeroTone;
  title: string;
  body: string;
  /** lg = 88px icon (M-screens), md = 80px (Overlay · Pro is on). */
  size?: "lg" | "md";
  /** Replaces the round icon, e.g. a payment logo. */
  visual?: ReactNode;
  /** Title element; h1 on full screens, h2 inside dialogs. */
  as?: "h1" | "h2";
  className?: string;
}

export function ResultHero({
  tone,
  title,
  body,
  size = "lg",
  visual,
  as: Title = "h1",
  className,
}: ResultHeroProps) {
  const circle = size === "lg" ? "size-m-hero-icon" : "size-pro-on-icon";
  const glyph = size === "lg" ? "size-10" : "size-pro-on-crown";
  return (
    <div
      className={cx("flex flex-col items-center gap-3 text-center", className)}
    >
      {visual ??
        (tone === "success" ? (
          <span
            className={cx(
              "flex shrink-0 items-center justify-center rounded-pill bg-status-success-soft",
              circle,
            )}
          >
            <span className="flex size-m-hero-icon-inner items-center justify-center rounded-pill bg-success text-on-cta">
              <Icon name="tick-02" className="size-m-hero-glyph" />
            </span>
          </span>
        ) : (
          <span
            className={cx(
              "flex shrink-0 items-center justify-center rounded-pill",
              tone === "error"
                ? "bg-status-error-soft text-error"
                : "bg-blue-soft text-blue",
              circle,
            )}
          >
            <Icon
              name={tone === "error" ? "alert-circle" : "crown"}
              className={glyph}
            />
          </span>
        ))}
      <Title className="w-full type-m-hero-title text-ink">{title}</Title>
      <p className="w-full px-2 type-body text-ink-2">{body}</p>
    </div>
  );
}
