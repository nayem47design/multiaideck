"use client";

import { useEffect, useState } from "react";

import { useResolvedTheme } from "@/lib/use-theme";

import { Aurora } from "../Aurora";
import { cx } from "../states";

// The top-of-screen background on desktop: React Bits' Aurora, as tuned in Background Studio
// (aurora, the same settings for Dark and Light; lightMode on the light theme). A product decision
// not yet in Figma; the colour stops are the requested studio palette, not Luminous tokens yet.
//
// The intro (the aurora rising in) plays once, the first time the platform appears in a browser
// session. Moving between pages remounts the background; it carries on from the same moment of
// the animation (a shared clock) with no intro, so it never restarts.

const COLOR_STOPS = ["#0041f6", "#4600f6", "#00b8f6"];

/** How strong it is per screen: full on Home-like screens, softer behind dense content. */
const OPACITY = { full: 0.56, soft: 0.4 } as const;

/** Shared by every mount in this tab, so a page change continues the motion. */
const CLOCK = { current: 0 };
const INTRO_KEY = "multiai-aurora-intro";
let introPlayed = false;

function shouldPlayIntro() {
  if (introPlayed || typeof window === "undefined") return !introPlayed;
  try {
    return sessionStorage.getItem(INTRO_KEY) !== "1";
  } catch {
    return true;
  }
}

export function AuroraField({
  strength = "full",
  fixed,
  className,
}: {
  strength?: keyof typeof OPACITY;
  fixed?: boolean;
  className?: string;
}) {
  const theme = useResolvedTheme();
  // Decided once per mount: only the first mount of the session plays the intro.
  const [intro] = useState(shouldPlayIntro);
  useEffect(() => {
    introPlayed = true;
    try {
      sessionStorage.setItem(INTRO_KEY, "1");
    } catch {
      // Private mode: the module flag still covers navigation within the tab.
    }
  }, []);

  return (
    <div
      aria-hidden
      data-light-field
      className={cx(
        // The aurora fades out at ~73% of this box. The box is the screen minus 24rem, so the visible
        // glow ends ~280px higher than a full-screen box would (≈ 380px down on a 900px screen), and
        // at least 40% of the screen on short windows. Pinned to the top, so long pages (Wallet,
        // Settings) don't stretch it. Product tuning, not in Figma.
        "pointer-events-none inset-x-0 top-0 -z-10 h-[max(40dvh,calc(100dvh-24rem))] overflow-hidden",
        fixed ? "fixed" : "absolute",
        className,
      )}
    >
      <Aurora
        colorStops={COLOR_STOPS}
        height={0.54}
        amplitude={0.95}
        blend={1}
        glow={1.35}
        speed={2.05}
        brightness={0.95}
        opacity={OPACITY[strength]}
        lightMode={theme === "light"}
        intro={intro}
        clock={CLOCK}
      />
    </div>
  );
}
