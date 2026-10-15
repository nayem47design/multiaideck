import Image from "next/image";

import art from "@/components/organisms/HomeHero/hero-models.json";
import artDark from "@/components/organisms/HomeHero/hero-models.dark.svg";
import artLight from "@/components/organisms/HomeHero/hero-models.svg";

import { cx } from "../states";

// Figma: the "Model constellation" (three AI orbs) on Home hero, Sign in and M1 · Welcome. It is
// the same 150×80 layer everywhere, so this reuses Home hero's SVG export (Light and Dark).
// Decorative.

const box = {
  width: art.image.width,
  height: art.image.height,
  left: -art.offset.x,
  top: -art.offset.y,
};

export function ModelConstellation({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cx(
        "relative h-hero-art-height w-hero-art-width shrink-0",
        className,
      )}
    >
      <Image
        src={artLight}
        alt=""
        unoptimized
        className="absolute dark-hidden max-w-none"
        style={box}
      />
      <Image
        src={artDark}
        alt=""
        unoptimized
        className="absolute light-hidden max-w-none"
        style={box}
      />
    </div>
  );
}
