import { existsSync, readdirSync } from "node:fs";

import { expect, test } from "@playwright/test";

import { compareWithFigma, MAX_DIFF_RATIO, openStory } from "./support/compare";

// Every atom variant exported from Figma (tests/visual/figma/<component>/<variant>.png, plus
// <variant>.dark.png from the Figma Dark board) is compared with its Storybook story.
// The story id is atoms-<component>--<variant>; Model orb uses one story with args.

const ROOT = "tests/visual/figma";
const SKIP = new Set(["button"]); // has its own spec

// Glass is translucent and blurs what is behind it; Figma exports it over nothing, which Figma
// renders almost opaque. Comparable only over a real background (needs a Figma frame for it).
const NOT_COMPARABLE: Record<string, string> = {
  "icon-button/glass": "glass needs a background behind it to compare",
};

function storyFor(
  component: string,
  variant: string,
): { id: string; args?: Record<string, string> } {
  if (component === "model-orb") {
    const [model, size] = variant.split("-");
    return { id: "atoms-model-orb--orb", args: { model, size } };
  }
  return { id: `atoms-${component}--${variant}` };
}

for (const component of readdirSync(ROOT).filter((d) => !SKIP.has(d))) {
  const variants = readdirSync(`${ROOT}/${component}`)
    .filter((f) => f.endsWith(".png") && !f.endsWith(".dark.png"))
    .map((f) => f.slice(0, -4));

  for (const variant of variants) {
    for (const theme of ["light", "dark"] as const) {
      const reference = `${ROOT}/${component}/${variant}${theme === "dark" ? ".dark" : ""}.png`;
      if (!existsSync(reference)) continue;

      test(`${component} ${variant} ${theme} matches Figma`, async ({
        page,
      }, testInfo) => {
        const key = `${component}/${variant}`;
        test.skip(key in NOT_COMPARABLE, NOT_COMPARABLE[key]);
        const { id, args } = storyFor(component, variant);
        await openStory(page, id, args, theme);
        const result = await compareWithFigma(
          page.locator("#storybook-root > *").first(),
          reference,
          testInfo,
        );
        testInfo.annotations.push({
          type: "diff",
          description: `${(result.diffRatio * 100).toFixed(2)}% · figma ${result.size.figma} · code ${result.size.code}`,
        });
        expect(result.size.code, "rendered size").toEqual(result.size.figma);
        expect(result.diffRatio, "pixel difference").toBeLessThan(
          MAX_DIFF_RATIO,
        );
      });
    }
  }
}
