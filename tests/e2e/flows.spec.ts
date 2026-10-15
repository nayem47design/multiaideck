import { expect, test, type Page } from "@playwright/test";

// The prototype's journeys (Figma flows "0 · Desktop · Full journey", "1 · Ask and compare",
// "2 · Top up with bKash", "3 · Settings and account", "7 Mobile"), clicked through end to end.

const isMobile = (page: Page) => (page.viewportSize()?.width ?? 0) < 768;

// Desktop and mobile layouts share one tree and hide the other with CSS, so match visible only.
const v = <T extends { filter: (o: { visible: boolean }) => T }>(l: T) =>
  l.filter({ visible: true });

test("sign in with a phone number and a code", async ({ page }) => {
  await page.goto("/sign-in?step=phone");
  await v(page.getByLabel("Mobile number")).fill("1712345214");
  await v(page.getByRole("button", { name: "Send code" })).click();
  await expect(page).toHaveURL(/\/sign-in\/code/);

  await v(page.getByLabel("Digit 1")).fill("4");
  for (const d of "82913") await page.keyboard.type(d);
  await v(page.getByRole("button", { name: "Verify and continue" })).click();
  await expect(page).toHaveURL(/localhost:3000\/$/);
});

test("ask, get the best answer, then compare all three", async ({ page }) => {
  await page.goto("/");
  const box = v(page.getByPlaceholder("Ask anything, in English or Bangla…"));
  await box.fill("Give me 3 name ideas for a small coffee shop in Dhaka");
  await v(page.getByRole("button", { name: "Send", exact: true })).click();

  await expect(page).toHaveURL(/\/c\/coffee-shop-names/);
  await expect(v(page.getByText("Asking 3 AIs…")).first()).toBeVisible();
  await expect(
    v(page.getByText("Best answer", { exact: true })).first(),
  ).toBeVisible({
    timeout: 10_000,
  });

  await page
    .getByRole("button", {
      name: isMobile(page)
        ? "See all 3 answers"
        : "See all 3 answers side by side",
    })
    .or(page.getByRole("link", { name: /See all 3 answers/ }))
    .first()
    .click();
  await expect(page).toHaveURL(/state=compare/);
});

test("a failed answer costs nothing and can be retried", async ({ page }) => {
  test.skip(isMobile(page), "desktop Compare layout");
  await page.goto("/c/coffee-shop-names?state=prompt-2");
  await expect(v(page.getByText(/Nothing was charged/)).first()).toBeVisible();
  await v(page.getByRole("button", { name: /Retry/ }))
    .first()
    .click();
  await expect(page).toHaveURL(/state=prompt-2-retry|retried=1/);
});

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
  await page.goto("/");
  await v(page.getByRole("button", { name: "Account menu" })).click();
  await v(page.getByRole("button", { name: "Sign out", exact: true })).click();
  await expect(page).toHaveURL(/\/sign-in/);
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

test("⌘K finds a chat", async ({ page }) => {
  test.skip(isMobile(page), "keyboard shortcut");
  await page.goto("/chats");
  await page.waitForLoadState("networkidle"); // the shortcut listens after hydration
  await page.keyboard.press("ControlOrMeta+k");
  const search = page.getByRole("dialog").getByRole("combobox");
  await search.fill("coffee");
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
