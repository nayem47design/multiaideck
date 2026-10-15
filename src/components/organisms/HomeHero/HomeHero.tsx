import Image from "next/image";

import { Icon, type IconName } from "@/components/atoms/Icon";
import { cx, focusRing } from "@/components/atoms/states";

import { Composer, type ComposerProps } from "../Composer";
import art from "./hero-models.json";
import artDark from "./hero-models.dark.svg";
import artLight from "./hero-models.svg";

// Figma: Design system › Home hero (103:29181): greeting, Composer, mode explainer, starters.
// The three-orb illustration (blurred light fields) is exported from Figma as SVG, Light and Dark.

export interface HomeStarter {
  icon: IconName;
  title: string;
  description: string;
  onClick?: () => void;
}

export interface HomeHeroProps {
  /** e.g. "Good evening, Imam". */
  greeting: string;
  subtitle: string;
  composer: ComposerProps;
  /** e.g. "Best answer asks 3 models in parallel…". */
  modeExplainer: string;
  starters: HomeStarter[];
  className?: string;
}

const artBox = {
  width: art.image.width,
  height: art.image.height,
  left: -art.offset.x,
  top: -art.offset.y,
};

export function HomeHero({
  greeting,
  subtitle,
  composer,
  modeExplainer,
  starters,
  className,
}: HomeHeroProps) {
  return (
    <section className={cx("flex w-full flex-col items-center", className)}>
      <div aria-hidden className="relative h-hero-art-height w-hero-art-width">
        <Image
          src={artLight}
          alt=""
          unoptimized
          className="absolute dark-hidden max-w-none"
          style={artBox}
        />
        <Image
          src={artDark}
          alt=""
          unoptimized
          className="absolute light-hidden max-w-none"
          style={artBox}
        />
      </div>
      <h1 className="mt-6 text-center type-display text-ink">{greeting}</h1>
      <p className="mt-2 text-center type-hero-subtitle text-ink-3">
        {subtitle}
      </p>
      <Composer {...composer} className={cx("mt-8", composer.className)} />
      <p className="mt-3 flex items-center gap-1-5 type-setting-row-help text-ink-3">
        <Icon name="git-merge" className="size-select-icon" />
        {modeExplainer}
      </p>
      <div className="mt-8 grid w-full grid-cols-3 gap-3">
        {starters.map((s) => (
          <button
            key={s.title}
            type="button"
            onClick={s.onClick}
            className={cx(
              "flex flex-col gap-3 rounded-answer-card border border-glass-rim glass p-4 text-left shadow-starter-card",
              "transition-transform duration-fast ease-out hover:-translate-y-0-5",
              focusRing,
            )}
          >
            <span className="flex size-10 items-center justify-center rounded-data-tile bg-blue-soft text-blue">
              <Icon name={s.icon} className="size-icon-button-icon" />
            </span>
            <span className="flex flex-col gap-0-5">
              <span className="type-ui-strong text-ink">{s.title}</span>
              <span className="type-starter-card-text text-ink-2">
                {s.description}
              </span>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
