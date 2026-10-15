import { expect, test } from "@playwright/test";

import { compareWithFigma, MAX_DIFF_RATIO, openStory } from "./support/compare";

// Figma: Design system › Button (28:8200). References exported at 2× with figma-console.
const VARIANTS = [
  "primary",
  "secondary",
  "ghost",
  "destructive",
  "tinted",
] as const;
const SIZES = ["md", "sm"] as const;

for (const variant of VARIANTS) {
  for (const size of SIZES) {
    test(`Button ${variant} ${size} matches Figma`, async ({
      page,
    }, testInfo) => {
      await openStory(page, `atoms-button--${variant}`, { size });
      const result = await compareWithFigma(
        page.getByRole("button"),
        `tests/visual/figma/button/${variant}-${size}.png`,
        testInfo,
      );
      testInfo.annotations.push({
        type: "diff",
        description: `${(result.diffRatio * 100).toFixed(2)}% · figma ${result.size.figma} · code ${result.size.code}`,
      });
      expect(result.size.code, "rendered size").toEqual(result.size.figma);
      expect(result.diffRatio, "pixel difference").toBeLessThan(MAX_DIFF_RATIO);
    });
  }
}
