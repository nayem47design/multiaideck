import { expect, test } from "@playwright/test";

import { signedOut } from "./auth";

// Every route from docs/BUILD_GUIDE.md Phase 5 loads in English and Bangla, throws no errors and
// never scrolls sideways (desktop 1440 and a 412px Android phone, per playwright.config.ts).
// App routes load signed in as the demo user; the sign-in routes load signed out.

const SIGNED_OUT_ROUTES = ["/sign-in", "/sign-in?step=phone", "/sign-in/code"];

const ROUTES = [
  "/",
  "/c/coffee-shop-names",
  "/c/hellow",
  "/c/who-are-you",
  "/c/coffee-shop-names?composer=menu",
  "/chats",
  "/images",
  "/presets",
  "/wallet",
  "/wallet/top-up",
  "/wallet/pay",
  "/wallet/paid",
  "/wallet/failed",
  "/wallet/payments",
  "/settings",
  "/settings/profile",
  "/settings/notifications",
  "/settings/privacy",
  "/settings/usage",
  "/settings/help",
];

for (const [routes, signedIn] of [
  [ROUTES, true],
  [SIGNED_OUT_ROUTES, false],
] as const)
  test.describe(signedIn ? "signed in" : "signed out", () => {
    if (!signedIn) test.use(signedOut);
    for (const locale of ["", "/bn"])
      for (const route of routes) {
        const url = `${locale}${route === "/" && locale ? "" : route}`;
        test(`loads ${url}`, async ({ page }) => {
          const errors: string[] = [];
          page.on("pageerror", (e) => errors.push(e.message));
          page.on("console", (m) => {
            if (m.type() === "error") errors.push(m.text());
          });

          const response = await page.goto(url);
          expect(response?.status()).toBeLessThan(400);
          await page.waitForLoadState("networkidle");
          expect((await page.locator("body").innerText()).trim()).not.toBe("");

          const overflow = await page.evaluate(
            () => document.documentElement.scrollWidth - window.innerWidth,
          );
          expect(overflow, "page scrolls sideways").toBeLessThanOrEqual(0);
          expect(errors).toEqual([]);
        });
      }
  });

// The chat id is read behind Suspense, so the 404 streams after a 200 status (Next adds noindex).
test("unknown chat shows not found", async ({ page }) => {
  await page.goto("/c/does-not-exist");
  await expect(page.getByText("This page doesn’t exist")).toBeVisible();
  await expect(
    page.locator('meta[name="robots"][content*="noindex"]'),
  ).not.toHaveCount(0);
});
