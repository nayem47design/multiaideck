import type { SVGProps } from "react";

import { type IconName, icons } from "./icons.generated";

// Figma: Design system › Icon/* (Hugeicons, 24×24). Paths are generated from Figma's SVG export.
// Strokes keep their Figma width at any size, as Figma does when an icon instance is resized.

export type { IconName };

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, "name"> {
  name: IconName;
  /** Accessible name. Omit for decorative icons next to visible text. */
  label?: string;
}

export function Icon({
  name,
  label,
  className = "size-icon-md",
  ...props
}: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
      className={`shrink-0 ${className}`}
      {...props}
    >
      {icons[name].paths.map((p, i) => (
        <path
          key={i}
          d={p.d}
          strokeWidth={p.strokeWidth}
          strokeLinecap={"strokeLinecap" in p ? p.strokeLinecap : undefined}
          strokeLinejoin={"strokeLinejoin" in p ? p.strokeLinejoin : undefined}
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </svg>
  );
}
