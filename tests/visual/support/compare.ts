import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

import type { Locator, Page, TestInfo } from "@playwright/test";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";

/**
 * AGENTS.md: a component matches Figma when less than 3% of pixels differ. Raised from 0.5%
 * because Figma and Chrome rasterise Geist text and curved edges differently.
 */
export const MAX_DIFF_RATIO = 0.03;

/**
 * Render a Storybook story like a Figma export: transparent background, component at the
 * top-left pixel. A centred story can land on a fractional x, and screenshots round outward,
 * which would add a pixel of width that is not in the component.
 */
export async function openStory(
  page: Page,
  id: string,
  args: Record<string, string> = {},
  theme: "light" | "dark" = "light",
) {
  const argString = Object.entries(args)
    .map(([k, v]) => `${k}:${v}`)
    .join(";");
  await page.goto(
    `/iframe.html?id=${id}&viewMode=story&globals=theme:${theme}${argString ? `&args=${argString}` : ""}`,
  );
  await page.addStyleTag({
    content: `
      html, body { background: transparent !important; margin: 0 !important; padding: 0 !important; }
      /* Figma exports glass over nothing: its background blur renders the fill fully opaque. */
      .glass, .glass-strong { backdrop-filter: none !important; -webkit-backdrop-filter: none !important; }
      .glass { background-color: rgb(from var(--glass-fill) r g b / 1) !important; }
      .glass-strong { background-color: rgb(from var(--glass-fill-strong) r g b / 1) !important; }
      #storybook-root { position: absolute !important; inset: 0 auto auto 0 !important; padding: 0 !important; margin: 0 !important; display: flex !important; align-items: flex-start !important; }
    `,
  });
  await page.waitForSelector(`html[data-theme="${theme}"] #storybook-root > *`);
  await page.evaluate(() => document.fonts.ready);
}

/**
 * Some Figma exports include effects (shadows) beyond the component, clipped by the parent frame.
 * A sibling <variant>.crop.json gives the component's box inside the export, per theme (CSS px).
 */
function cropToNode(img: PNG, figmaPng: string): PNG {
  const cropFile = figmaPng.replace(/(\.dark)?\.png$/, ".crop.json");
  if (!existsSync(cropFile)) return img;
  const crop = JSON.parse(readFileSync(cropFile, "utf8"))[
    figmaPng.endsWith(".dark.png") ? "dark" : "light"
  ];
  const scale = 2;
  const out = new PNG({
    width: crop.width * scale,
    height: crop.height * scale,
  });
  PNG.bitblt(
    img,
    out,
    crop.x * scale,
    crop.y * scale,
    out.width,
    out.height,
    0,
    0,
  );
  return out;
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
  const figma = cropToNode(PNG.sync.read(readFileSync(figmaPng)), figmaPng);
  const code = PNG.sync.read(
    await locator.screenshot({ omitBackground: true, animations: "disabled" }),
  );

  return diffAndAttach(figma, code, testInfo);
}

/** Pixel-diff two images (padded to the larger size) and attach figma, code and diff PNGs. */
export async function diffAndAttach(
  figma: PNG,
  code: PNG,
  testInfo: TestInfo,
): Promise<Comparison> {
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
    threshold: Number(process.env.VISUAL_COLOR_THRESHOLD ?? 0.1),
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
