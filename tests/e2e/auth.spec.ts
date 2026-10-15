import { expect, test, type Page } from "@playwright/test";

import { freshIp, lastCode, NAV, randomPhone, signedOut } from "./auth";

// Sign-in: wrong codes, the sign-in gate on app pages, Google without keys.

const v = <T extends { filter: (o: { visible: boolean }) => T }>(l: T) =>
  l.filter({ visible: true });

async function sendCode(page: Page, phone: string) {
  await v(page.getByLabel("Mobile number")).fill(phone);
  await v(page.getByRole("button", { name: "Send code" })).click();
  await expect(page).toHaveURL(/\/sign-in\/code/, { timeout: NAV });
}

async function typeCode(page: Page, code: string) {
  await v(page.getByLabel("Digit 1")).fill(code[0]);
  for (const d of code.slice(1)) await page.keyboard.type(d);
  await v(page.getByRole("button", { name: "Verify and continue" })).click();
}

test.describe("signed out", () => {
  test.use(signedOut);
  test.setTimeout(90_000);
  test.beforeEach(async ({ page }) => freshIp(page));

  test("app pages ask you to sign in, then bring you back", async ({
    page,
  }) => {
    await page.goto("/wallet");
    await expect(page).toHaveURL(/\/sign-in\?next=%2Fwallet$/, {
      timeout: NAV,
    });

    const phone = randomPhone();
    await page.goto("/sign-in?step=phone&next=%2Fwallet");
    await sendCode(page, phone);
    await typeCode(page, await lastCode(page.request, phone));
    await expect(page).toHaveURL(/\/wallet$/, { timeout: NAV });
  });

  test("Bangla pages keep the language on the way to sign-in", async ({
    page,
  }) => {
    await page.goto("/bn/settings");
    await expect(page).toHaveURL(/\/bn\/sign-in\?next=%2Fsettings$/, {
      timeout: NAV,
    });
  });

  test("a wrong code says how many tries are left", async ({ page }) => {
    const phone = randomPhone();
    await page.goto("/sign-in?step=phone");
    await sendCode(page, phone);
    const code = await lastCode(page.request, phone);
    const wrong = String((Number(code) + 1) % 1e6).padStart(6, "0");
    await typeCode(page, wrong);
    await expect(
      v(page.getByText("That code isn’t right. 4 tries left.")),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/sign-in\/code/, { timeout: NAV });

    // The right code still works.
    await typeCode(page, code);
    await expect(page).toHaveURL(/localhost:3000\/$/, { timeout: NAV });
  });

  test("asking again too soon shows a countdown", async ({ page }) => {
    const phone = randomPhone();
    await page.goto("/sign-in?step=phone");
    await sendCode(page, phone);
    await v(
      page.getByRole("link", { name: "Wrong number? Change it" }),
    ).click();
    await expect(page).toHaveURL(/\/sign-in/, { timeout: NAV });
    await v(page.getByLabel("Mobile number")).fill(phone);
    await v(page.getByRole("button", { name: "Send code" })).click();
    await expect(
      v(page.getByText(/Wait \d:\d\d before asking for another code\./)),
    ).toBeVisible();
  });

  test("an invalid number is caught before sending", async ({ page }) => {
    await page.goto("/sign-in?step=phone");
    await v(page.getByLabel("Mobile number")).fill("12345");
    await v(page.getByRole("button", { name: "Send code" })).click();
    await expect(
      v(page.getByText(/Enter your 10-digit mobile number/)),
    ).toBeVisible();
  });

  test("Google without keys explains instead of failing", async ({ page }) => {
    const check = await page.request.get("/api/auth/google?check=1");
    test.skip(check.status() !== 503, "Google sign-in is configured here");
    await page.goto("/sign-in?step=phone");
    await v(page.getByRole("button", { name: "Continue with Google" })).click();
    await expect(
      v(page.getByText(/Google sign-in isn’t available yet/)),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/sign-in/, { timeout: NAV });
  });
});

test("signed in, the sign-in page goes home", async ({ page }) => {
  await page.goto("/sign-in");
  await expect(page).toHaveURL(/localhost:3000\/$/, { timeout: NAV });
});

test("the account shows the signed-in user", async ({ page }) => {
  const me = await page.request.get("/api/me");
  expect(me.ok()).toBeTruthy();
  const { user } = (await me.json()) as { user: { name: string } };
  await page.goto("/settings/profile");
  await expect(
    v(page.getByRole("textbox", { name: "Display name" })),
  ).toHaveValue(user.name);
});
