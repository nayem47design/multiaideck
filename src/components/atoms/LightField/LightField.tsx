import type { CSSProperties } from "react";

import { cx } from "../states";

// Figma: the "Light field" behind each Prototype screen: blurred ellipses at the top of the page.
// Sizes, positions, blur and opacity are screen tokens read from Figma (field-<variant>-<n>-*).
// Desktop fields are drawn on a 1440px screen and stay centred as the window resizes; the sign-in
// field is pinned to the left edge, as in Figma.

export type LightFieldVariant =
  "app" | "dimmed" | "page" | "wallet" | "auth" | "mobile";

const FILLS: Record<LightFieldVariant, string[]> = {
  app: ["bg-field-blue", "bg-field-sky", "bg-iris-violet"],
  dimmed: ["bg-field-blue", "bg-field-sky"],
  page: ["bg-field-blue", "bg-field-sky"],
  wallet: ["bg-field-blue", "bg-field-sky"],
  auth: ["bg-field-blue"],
  mobile: ["bg-field-blue"],
};

const FRAME: Partial<Record<LightFieldVariant, string>> = {
  app: "--screen-desktop",
  dimmed: "--screen-desktop",
  page: "--screen-desktop",
  wallet: "--screen-desktop",
  mobile: "--screen-mobile",
};

export interface LightFieldProps {
  variant?: LightFieldVariant;
  /** Pin to the viewport (behind a whole screen) instead of the nearest positioned parent. */
  fixed?: boolean;
  /** Below 768px, switch to the mobile field (as on the M-screens). Default true. */
  responsive?: boolean;
  className?: string;
}

export function LightField({
  variant = "app",
  fixed = false,
  responsive = true,
  className,
}: LightFieldProps) {
  if (responsive && variant !== "mobile")
    return (
      <>
        <Field
          variant={variant}
          fixed={fixed}
          className={cx("max-md:hidden", className)}
        />
        <Field
          variant="mobile"
          fixed={fixed}
          className={cx("md:hidden", className)}
        />
      </>
    );
  return <Field variant={variant} fixed={fixed} className={className} />;
}

function Field({
  variant,
  fixed,
  className,
}: {
  variant: LightFieldVariant;
  fixed: boolean;
  className?: string;
}) {
  const frame = FRAME[variant];
  return (
    <div
      aria-hidden
      data-light-field
      className={cx(
        "pointer-events-none inset-0 -z-10 overflow-hidden",
        fixed ? "fixed" : "absolute",
        className,
      )}
    >
      {FILLS[variant].map((fill, i) => {
        const t = `--field-${variant}-${i + 1}`;
        const style: CSSProperties = {
          width: `var(${t}-w)`,
          height: `var(${t}-h)`,
          top: `var(${t}-y)`,
          left: frame
            ? `calc(50% - var(${frame}) / 2 + var(${t}-x))`
            : `var(${t}-x)`,
          opacity: `var(${t}-opacity)`,
          filter: `blur(var(${t}-blur))`,
        };
        return (
          <div
            key={fill}
            className={cx("absolute rounded-full", fill)}
            style={style}
          />
        );
      })}
    </div>
  );
}
