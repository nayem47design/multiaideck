import { existsSync, readdirSync } from "node:fs";

import { expect, test } from "@playwright/test";

import { compareWithFigma, MAX_DIFF_RATIO, openStory } from "./support/compare";

// Every component variant exported from Figma (tests/visual/figma/<component>/<variant>.png, plus
// <variant>.dark.png from the Figma Dark board) is compared with its Storybook story.
// The story id is <layer>-<component>--<variant>, where the layer is the src/components folder
// that holds the component. Model orb uses one story with args.

const ROOT = "tests/visual/figma";
const SKIP = new Set(["button", "screens"]); // own specs

// Figma component frames that are narrower than their own content, so Figma's export overlaps
// itself. They are checked inside their screens instead.
const NOT_COMPARABLE: Record<string, string> = {
  "model-picker-modal/default":
    "Intentionally smaller than Figma (product owner): 88% of its width, at most 85% of the window's height. Figma frame to be updated.",
  "thinking-dots/default":
    "Code shows the animated thinking orb (thinking-orbs), a product decision listed under Figma's Code-only effects; the Figma component is a static placeholder.",
};

// Variants whose pixels cannot be compared with their Figma export; only the size is checked.
const SIZE_ONLY: Record<string, string> = {};

const LAYERS = ["atoms", "molecules", "organisms", "templates"];
const pascal = (slug: string) =>
  slug.replace(/(^|-)([a-z0-9])/g, (_m, _d, c: string) => c.toUpperCase());
const layerOf = (component: string) => {
  const layer = LAYERS.find((l) =>
    existsSync(`src/components/${l}/${pascal(component)}`),
  );
  if (!layer)
    throw new Error(
      `No component folder for ${component} (${pascal(component)})`,
    );
  return layer;
};

function storyFor(
  component: string,
  variant: string,
): { id: string; args?: Record<string, string> } {
  if (component === "model-orb") {
    const [model, size] = variant.split("-");
    return { id: "atoms-model-orb--orb", args: { model, size } };
  }
  return { id: `${layerOf(component)}-${component}--${variant}` };
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
        if (key in SIZE_ONLY) {
          testInfo.annotations.push({
            type: "size only",
            description: SIZE_ONLY[key],
          });
          return;
        }
        expect(result.diffRatio, "pixel difference").toBeLessThan(
          MAX_DIFF_RATIO,
        );
      });
    }
  }
}
