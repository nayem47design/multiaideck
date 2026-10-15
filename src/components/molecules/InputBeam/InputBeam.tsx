"use client";

import { BorderBeam, type BorderBeamColorVariant } from "border-beam";
import type { ReactNode } from "react";

import { cx } from "@/components/atoms/states";
import { useResolvedTheme } from "@/lib/use-theme";

// A light beam riding around the main prompt input's border (the border-beam package,
// libraries.dev/beam). Not in Figma: a product decision. Blue to match the brand: on dark the
// pale-blue "ice" palette reads clearly; on light it washes out, so light uses "ocean" (blue,
// with a little violet) with a narrow hue drift. Follows the app's theme, not only the OS.

const LOOK: Record<
  "light" | "dark",
  {
    colorVariant: BorderBeamColorVariant;
    brightness: number;
    saturation: number;
  }
> = {
  light: { colorVariant: "ocean", brightness: 1.3, saturation: 1.2 },
  dark: { colorVariant: "ice", brightness: 1.8, saturation: 1.8 },
};

export interface InputBeamProps {
  children: ReactNode;
  /** Pause the animation (e.g. while answers are streaming). */
  active?: boolean;
  className?: string;
}

export function InputBeam({
  children,
  active = true,
  className,
}: InputBeamProps) {
  const theme = useResolvedTheme();
  return (
    <BorderBeam
      size="md"
      theme={theme}
      strength={1}
      hueRange={12}
      {...LOOK[theme]}
      active={active}
      className={cx("w-full", className)}
    >
      {children}
    </BorderBeam>
  );
}
