import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

import type { Locator, Page, TestInfo } from "@playwright/test";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";

/** AGENTS.md: a component matches Figma when less than 0.5% of pixels differ. */
export const MAX_DIFF_RATIO = 0.005;

/**
 * Render a Storybook story like a Figma export: transparent background, component at the
 * top-left pixel. A centred story can land on a fractional x, and screenshots round outward,
 * which would add a pixel of width that is not in the component.
 */
export async function openStory(
  page: Page,
  id: string,
  args: Record<string, string> = {},
) {
  const argString = Object.entries(args)
    .map(([k, v]) => `${k}:${v}`)
    .join(";");
  await page.goto(
    `/iframe.html?id=${id}&viewMode=story&globals=theme:light${argString ? `&args=${argString}` : ""}`,
  );
  await page.addStyleTag({
    content: `
      html, body { background: transparent !important; margin: 0 !important; padding: 0 !important; }
      #storybook-root { position: absolute !important; inset: 0 auto auto 0 !important; padding: 0 !important; margin: 0 !important; }
    `,
  });
  await page.evaluate(() => document.fonts.ready);
}

export interface Comparison {
  diffRatio: number;
  diffPixels: number;
  size: { figma: [number, number]; code: [number, number] };
}

/** Screenshot `locator` and compare it with a Figma reference PNG exported at the same scale. */
export async function compareWithFigma(
  locator: Locator,
  figmaPng: string,
  testInfo: TestInfo,
): Promise<Comparison> {
  const figma = PNG.sync.read(readFileSync(figmaPng));
  const code = PNG.sync.read(
    await locator.screenshot({ omitBackground: true, animations: "disabled" }),
  );

  const size: Comparison["size"] = {
    figma: [figma.width, figma.height],
    code: [code.width, code.height],
  };
  const width = Math.max(figma.width, code.width);
  const height = Math.max(figma.height, code.height);
  const pad = (img: PNG) => {
    if (img.width === width && img.height === height) return img;
    const out = new PNG({ width, height });
    PNG.bitblt(img, out, 0, 0, img.width, img.height, 0, 0);
    return out;
  };
  const [a, b] = [pad(figma), pad(code)];
  const diff = new PNG({ width, height });
  const diffPixels = pixelmatch(a.data, b.data, diff.data, width, height, {
    threshold: 0.1,
  });
  const diffRatio = diffPixels / (width * height);

  const out = testInfo.outputPath("compare");
  mkdirSync(out, { recursive: true });
  for (const [name, img] of [
    ["figma", a],
    ["code", b],
    ["diff", diff],
  ] as const) {
    const file = `${out}/${name}.png`;
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, PNG.sync.write(img));
    await testInfo.attach(name, { path: file, contentType: "image/png" });
  }
  return { diffRatio, diffPixels, size };
}
