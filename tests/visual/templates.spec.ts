import { readFileSync } from "node:fs";

import { expect, test } from "@playwright/test";

// Templates are layouts with placeholder slots, drawn in Figma at 0.75 scale of 1440×900. This
// checks that each region lands where Figma puts it: the template snapshot ÷ 0.75, within 1px.

const { scale, templates } = JSON.parse(
  readFileSync("src/styles/figma/templates.json", "utf8"),
) as {
  scale: number;
  templates: Record<
    string,
    Record<string, { x: number; y: number; w: number; h: number }>
  >;
};

type Check = {
  figma: string;
  selector: string;
  props: ("x" | "y" | "w" | "h")[];
};

const CASES: { story: string; template: string; checks: Check[] }[] = [
  {
    story: "templates-app-shell--default",
    template: "Template/App shell",
    checks: [
      {
        figma: "Sidebar",
        selector: "[data-region=sidebar] > *",
        props: ["x", "y", "w", "h"],
      },
      {
        figma: "Slot/Hero or answer thread",
        selector: "[data-slot]",
        props: ["x", "y", "w"],
      },
      {
        figma: "Composer",
        selector: "[data-region=composer] > *",
        props: ["x", "w"],
      },
    ],
  },
  {
    story: "templates-settings-shell--default",
    template: "Template/Settings shell",
    checks: [
      {
        figma: "Page top bar",
        selector: "[data-region=top-bar] > *",
        props: ["x", "y", "w", "h"],
      },
      {
        figma: "Settings nav",
        selector: "[data-region=nav] > *",
        props: ["x", "y", "w", "h"],
      },
      {
        figma: "Slot/Page title + setting cards",
        selector: "[data-slot]",
        props: ["x", "y", "w"],
      },
    ],
  },
  {
    story: "templates-full-page-with-checkout--default",
    template: "Template/Full page with checkout",
    checks: [
      {
        figma: "Page top bar",
        selector: "[data-region=top-bar] > *",
        props: ["x", "y", "w", "h"],
      },
      {
        figma: "Slot/Summary cards",
        selector: "[data-region=summary] [data-slot]",
        props: ["x", "y", "w", "h"],
      },
      {
        figma: "Slot/Choose amount + pay with",
        selector: "[data-region=main] [data-slot]",
        props: ["x", "y", "w"],
      },
      {
        figma: "Order summary",
        selector: "[data-region=order-summary] > *",
        props: ["x", "y", "w"],
      },
    ],
  },
];

test.use({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });

for (const c of CASES) {
  test(`${c.template} layout matches Figma`, async ({ page }) => {
    await page.goto(
      `/iframe.html?id=${c.story}&viewMode=story&globals=theme:light`,
    );
    await page.waitForSelector("#storybook-root > *");
    await page.evaluate(() => document.fonts.ready);
    for (const check of c.checks) {
      const box = await page.locator(check.selector).first().boundingBox();
      expect(box, check.figma).not.toBeNull();
      const f = templates[c.template][check.figma];
      const want = {
        x: f.x / scale,
        y: f.y / scale,
        w: f.w / scale,
        h: f.h / scale,
      };
      const got = { x: box!.x, y: box!.y, w: box!.width, h: box!.height };
      for (const p of check.props) {
        expect
          .soft(
            Math.abs(got[p] - want[p]),
            `${check.figma} ${p}: code ${got[p]} vs Figma ${want[p]}`,
          )
          .toBeLessThanOrEqual(1);
      }
    }
  });
}
