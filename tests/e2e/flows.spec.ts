import { expect, test, type Page } from "@playwright/test";

import {
  freshIp,
  lastCode,
  newPhoneUser,
  ownDemoSession,
  randomPhone,
  NAV,
  signedOut,
} from "./auth";

// The prototype's journeys (Figma flows "0 · Desktop · Full journey", "1 · Ask and compare",
// "2 · Top up with bKash", "3 · Settings and account", "7 Mobile"), clicked through end to end.

const isMobile = (page: Page) => (page.viewportSize()?.width ?? 0) < 768;

// Every test starts signed in as the demo user (tests/e2e/auth.setup.ts) unless it says otherwise.

// Desktop and mobile layouts share one tree and hide the other with CSS, so match visible only.
const v = <T extends { filter: (o: { visible: boolean }) => T }>(l: T) =>
  l.filter({ visible: true });

test.describe("signed out", () => {
  test.use(signedOut);

  test("sign in with a phone number and a code", async ({ page }) => {
    await freshIp(page);
    const phone = randomPhone();
    await page.goto("/sign-in?step=phone");
    await v(page.getByLabel("Mobile number")).fill(phone);
    await v(page.getByRole("button", { name: "Send code" })).click();
    await expect(page).toHaveURL(/\/sign-in\/code/, { timeout: NAV });

    const code = await lastCode(page.request, phone);
    await v(page.getByLabel("Digit 1")).fill(code[0]);
    for (const d of code.slice(1)) await page.keyboard.type(d);
    await v(page.getByRole("button", { name: "Verify and continue" })).click();
    await expect(page).toHaveURL(/localhost:3000\/$/, { timeout: NAV });
  });
});

// Asking, comparing, failures, retry and follow-ups run on real data: tests/e2e/chat.spec.ts.

test("top up with bKash", async ({ page }) => {
  test.skip(
    isMobile(page),
    "the mobile top-up has its own flow (M11 → M34 → M12)",
  );
  await page.goto("/wallet");
  await v(
    page.getByRole("button", { name: /^Pay BDT .* with bKash$/ }),
  ).click();
  await expect(page).toHaveURL(/\/wallet\/pay/);
  await v(page.getByRole("button", { name: "I approved it" })).click();
  await expect(page).toHaveURL(/\/wallet\/paid/);
  await expect(v(page.getByText("Payment received")).first()).toBeVisible();
});

test("a failed payment says nothing was charged", async ({ page }) => {
  test.skip(isMobile(page), "desktop checkout dialog");
  await page.goto("/wallet/pay");
  await v(
    page.getByRole("button", { name: "Simulate a failed payment" }),
  ).click();
  await expect(page).toHaveURL(/\/wallet\/failed/);
  await expect(v(page.getByText(/No money was taken/)).first()).toBeVisible();
});

test("sign out from the sidebar", async ({ page }) => {
  test.skip(
    isMobile(page),
    "the sidebar is desktop only; mobile signs out from Account",
  );
  await ownDemoSession(page);
  await page.goto("/");
  // R17/R18: the account row opens the Account menu; Sign out opens the sign-out dialog.
  await v(page.getByRole("button", { name: /Account menu/ })).click();
  await page.getByRole("menuitem", { name: "Sign out" }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Sign out", exact: true })
    .click();
  await expect(page).toHaveURL(/\/sign-in/, { timeout: NAV });
  // The session is gone: app pages send you back to sign in.
  await page.goto("/wallet");
  await expect(page).toHaveURL(/\/sign-in\?next=%2Fwallet/);
  expect((await page.request.get("/api/me")).status()).toBe(401);
});

test("account menu: keyboard, Esc, and its pages", async ({ page }) => {
  test.skip(isMobile(page), "the sidebar is desktop only");
  await page.goto("/");
  const row = v(page.getByRole("button", { name: /Account menu/ }));
  await row.focus();
  await page.keyboard.press("Enter");
  const menu = page.getByRole("menu", { name: "Account menu" });
  await expect(menu).toBeVisible();
  await expect(menu.getByRole("menuitem")).toHaveText([
    /Settings/,
    /Usage & billing/,
    /Language\s*English/,
    /Help & support/,
    /Sign out/,
  ]);
  await page.keyboard.press("Escape");
  await expect(menu).toBeHidden();
  await expect(row).toBeFocused();

  await row.click();
  await menu.getByRole("menuitem", { name: "Usage & billing" }).click();
  await expect(page).toHaveURL(/\/settings\/usage$/, { timeout: NAV });
});

test("delete account needs the word DELETE", async ({ page }) => {
  test.skip(isMobile(page), "desktop Profile");
  await page.goto("/settings/profile");
  await v(page.getByRole("button", { name: "Delete account" }))
    .first()
    .click();
  const dialog = page.getByRole("dialog");
  const del = dialog.getByRole("button", { name: /^Delete/ }).last();
  await expect(del).toBeDisabled();
  await dialog.getByRole("textbox").fill("DELETE");
  await expect(del).toBeEnabled();
});

test("delete account closes it and signs out", async ({ page }) => {
  test.skip(isMobile(page), "desktop Profile");
  await newPhoneUser(page);
  await page.goto("/settings/profile");
  await v(page.getByRole("button", { name: "Delete account" }))
    .first()
    .click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("textbox").fill("DELETE");
  await dialog
    .getByRole("button", { name: /^Delete/ })
    .last()
    .click();
  await expect(page).toHaveURL(/\/sign-in/, { timeout: NAV });
  expect((await page.request.get("/api/me")).status()).toBe(401);
});

test("⌘K finds a chat", async ({ page }) => {
  test.skip(isMobile(page), "keyboard shortcut");
  await page.goto("/chats");
  await page.waitForLoadState("networkidle"); // the shortcut listens after hydration
  await page.keyboard.press("ControlOrMeta+k");
  const search = page.getByRole("dialog").getByRole("combobox");
  // Other tests add chats with the same coffee prompt; only the seeded chat has this title.
  await search.fill("coffee shop names");
  await expect(
    page.getByRole("dialog").getByText("Coffee shop names"),
  ).toBeVisible();
  await search.press("Enter");
  await expect(page).toHaveURL(/\/c\/coffee-shop-names/);
});

test("mobile tab bar moves between the four root screens", async ({ page }) => {
  test.skip(!isMobile(page), "tab bar shows below 768px");
  test.setTimeout(90_000); // the dev server compiles each route on first visit
  await page.goto("/");
  const tabs = page.getByRole("navigation", { name: "Main" });
  for (const [tab, url] of [
    ["Chats", /\/chats$/],
    ["Wallet", /\/wallet$/],
    ["Account", /\/settings$/],
    ["Ask", /localhost:3000\/$/],
  ] as const) {
    await tabs.getByRole("link", { name: tab }).click();
    await expect(page).toHaveURL(url, { timeout: 20_000 });
    await page.waitForLoadState("networkidle");
  }
});

test("switching to Bangla keeps the page", async ({ page }) => {
  test.skip(!isMobile(page), "the mobile Account screen has the language row");
  await page.goto("/settings");
  await page
    .getByRole("button", { name: /App language|Language/ })
    .first()
    .click();
  await page
    .getByRole("radio", { name: /বাংলা/ })
    .or(v(page.getByRole("button", { name: /বাংলা/ })))
    .first()
    .click();
  await page
    .getByRole("button", { name: /Done/ })
    .click()
    .catch(() => {});
  await expect(page).toHaveURL(/\/bn\/settings/);
});
