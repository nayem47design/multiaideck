import { readFileSync } from "node:fs";

import { expect, test, type BrowserContextOptions } from "@playwright/test";
import { PNG } from "pngjs";

import { SCREENS } from "./screens.manifest";
import { diffAndAttach, MAX_DIFF_RATIO } from "./support/compare";

// BUILD_GUIDE Phase 7: every Figma Prototype frame compared with the same screen in the app, in
// the same conditions — same viewport and scale, fonts loaded, animations frozen, signed in as the
// demo user with the prototype's data (the coffee-shop chat, 10,684 credits).
//
// References: tests/visual/figma/screens/<slug>__<theme>__<width>.png (+ frames.json), exported
// read-only from Figma. Desktop at 1x (1440 wide covers every design pixel), mobile at 2x.
// Run: npm run test:screens (needs the dev server on :3000).

const ROOT = "tests/visual/figma/screens";
const frames: Record<
  string,
  {
    id: string;
    name: string;
    theme: "light" | "dark";
    width: number;
    height: number;
    scale: number;
  }
> = JSON.parse(readFileSync(`${ROOT}/frames.json`, "utf8"));

// Mobile frames include a drawn phone status bar (device chrome, not built): crop it from the
// reference. Its height comes from the snapshot, per frame.
const mobileSnapshot: Record<
  string,
  { k?: { n: string; h: number; y: number }[] }
> = JSON.parse(
  readFileSync("src/styles/figma/screens-mobile.json", "utf8"),
).screens;
const statusBar = (name: string) =>
  mobileSnapshot[name]?.k?.find((c) => c.n === "Status bar" && c.y === 0)?.h ??
  0;

function crop(img: PNG, top: number) {
  if (!top) return img;
  const out = new PNG({ width: img.width, height: img.height - top });
  PNG.bitblt(img, out, 0, top, img.width, out.height, 0, 0);
  return out;
}

const FREEZE = `
  *, *::before, *::after {
    animation: none !important; transition: none !important; caret-color: transparent !important;
  }
`;

for (const [file, frame] of Object.entries(frames)) {
  const slug = file.split("__")[0];
  const screen = SCREENS[slug];

  test(`${slug} ${frame.theme} ${frame.width} matches Figma`, async ({
    browser,
  }, testInfo) => {
    expect(screen, `No entry for ${slug} in screens.manifest.ts`).toBeTruthy();
    test.skip(!!screen.todo, screen.todo);

    const mobile = frame.width === 360;
    const top = mobile ? statusBar(frame.name) : 0;
    const options: BrowserContextOptions = mobile
      ? {
          viewport: { width: 360, height: frame.height - top },
          deviceScaleFactor: frame.scale,
          isMobile: true,
          hasTouch: true,
        }
      : {
          viewport: { width: 1440, height: 900 },
          deviceScaleFactor: frame.scale,
        };
    const context = await browser.newContext({
      ...options,
      baseURL: "http://localhost:3000",
      reducedMotion: "reduce",
      locale: "en-US",
    });
    await context.addInitScript((theme) => {
      localStorage.setItem("multiai-theme", theme);
    }, frame.theme);

    // Signed in as the demo user with the prototype's data (dev-only endpoint).
    const signIn = await context.request.post("/api/dev/sign-in-demo");
    expect(signIn.ok(), "POST /api/dev/sign-in-demo").toBeTruthy();

    const page = await context.newPage();
    await page.goto(screen.url);
    await page.waitForLoadState("networkidle");
    await page.addStyleTag({ content: FREEZE });
    await screen.setup?.(page);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(200);

    const shot = screen.element
      ? await page
          .locator(screen.element)
          .filter({ visible: true })
          .first()
          .screenshot()
      : await page.screenshot({ fullPage: !!screen.fullPage });
    const reference = crop(
      PNG.sync.read(readFileSync(`${ROOT}/${file}`)),
      top * frame.scale,
    );
    const result = await diffAndAttach(
      reference,
      PNG.sync.read(shot),
      testInfo,
    );
    await context.close();

    testInfo.annotations.push({
      type: "diff",
      description: `${(result.diffRatio * 100).toFixed(2)}% · figma ${result.size.figma} · code ${result.size.code}`,
    });
    expect(result.size.code, "rendered size").toEqual(result.size.figma);
    expect(result.diffRatio, "pixel difference").toBeLessThan(MAX_DIFF_RATIO);
  });
}
