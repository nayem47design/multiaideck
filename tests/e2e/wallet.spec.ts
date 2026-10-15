import {
  expect,
  test,
  type APIRequestContext,
  type Page,
} from "@playwright/test";

import { newPhoneUser } from "./auth";

// Wallet flows against the real API with the sandbox payment provider (no PayStation keys):
// top up on desktop (dialog) and mobile (M11 → M34 → M12), a failed payment, Go Pro, and the
// Usage screen. Tests sign in as the demo user (POST /api/dev/sign-in-demo seeds the demo data and
// starts a session in this browser context). Tests that check exact balance changes sign in as a
// new user instead (newPhoneUser from ./auth: SMS code read from /api/dev/last-code), because other tests running in
// parallel spend and top up the demo user's credits.

/** The dev server may compile a route on first visit, under load from other tests. */
const NAV = 20_000;

const isMobile = (page: Page) => (page.viewportSize()?.width ?? 0) < 768;
const v = <T extends { filter: (o: { visible: boolean }) => T }>(l: T) =>
  l.filter({ visible: true });

test.beforeEach(async ({ page }) => {
  const res = await page.request.post("/api/dev/sign-in-demo");
  expect(res.ok()).toBeTruthy();
});

async function balance(request: APIRequestContext) {
  const res = await request.get("/api/wallet");
  expect(res.ok()).toBeTruthy();
  return ((await res.json()) as { balance: { credits: number } }).balance
    .credits;
}

async function paymentFromUrl(page: Page) {
  const id = new URL(page.url()).searchParams.get("payment");
  expect(id).toBeTruthy();
  const res = await page.request.get(`/api/payments/${id}`);
  return (await res.json()) as {
    status: string;
    credits: number;
    bonusCredits: number;
    kind: string;
  };
}

test("top up BDT 699 with bKash: balance grows by credits + bonus, once", async ({
  page,
}) => {
  test.setTimeout(90_000);
  await newPhoneUser(page);
  const before = await balance(page.request);

  if (isMobile(page)) {
    // M11 → M34 → M12
    await page.goto("/wallet/top-up");
    await v(page.getByRole("button", { name: /Pay ৳699 with bKash/ })).click();
    await expect(page).toHaveURL(/\/wallet\/pay\?payment=/, { timeout: NAV });
    // M34 approves itself after a few seconds (the prototype's timer); tap it to go now.
    await v(page.getByRole("button", { name: "Open bKash again" })).click();
  } else {
    await page.goto("/wallet");
    await v(
      page.getByRole("button", { name: "Pay BDT 699 with bKash" }),
    ).click();
    await expect(page).toHaveURL(/\/wallet\/pay\?payment=/, { timeout: NAV });
    await v(page.getByRole("button", { name: "I approved it" })).click();
  }

  await expect(page).toHaveURL(/\/wallet\/paid\?payment=/, { timeout: NAV });
  await expect(v(page.getByText("Payment received")).first()).toBeVisible({
    timeout: NAV,
  });
  const payment = await paymentFromUrl(page);
  expect(payment).toMatchObject({
    status: "paid",
    credits: 76_890,
    bonusCredits: 6_990,
  });
  expect(await balance(page.request)).toBe(before + 76_890);

  // Reloading the result page, or deciding again, never credits twice.
  await page.reload();
  await expect(v(page.getByText("Payment received")).first()).toBeVisible({
    timeout: NAV,
  });
  const id = new URL(page.url()).searchParams.get("payment");
  await page.request.post(`/api/payments/${id}/sandbox`, {
    data: { outcome: "paid" },
  });
  expect(await balance(page.request)).toBe(before + 76_890);
  await expect(
    v(
      page.getByText(
        `${new Intl.NumberFormat("en").format(before + 76_890)} credits`,
      ),
    ).first(),
  ).toBeVisible();
});

test("a failed payment changes nothing and says nothing was charged", async ({
  page,
}) => {
  test.setTimeout(60_000);
  await newPhoneUser(page);
  const before = await balance(page.request);

  if (isMobile(page)) {
    await page.goto("/wallet/top-up");
    await v(page.getByRole("button", { name: /Pay ৳699 with bKash/ })).click();
    await expect(page).toHaveURL(/\/wallet\/pay\?payment=/, { timeout: NAV });
    await v(page.getByRole("button", { name: "Cancel payment" })).click();
  } else {
    await page.goto("/wallet");
    await v(
      page.getByRole("button", { name: "Pay BDT 699 with bKash" }),
    ).click();
    await expect(page).toHaveURL(/\/wallet\/pay\?payment=/, { timeout: NAV });
    await v(
      page.getByRole("button", { name: "Simulate a failed payment" }),
    ).click();
  }

  await expect(page).toHaveURL(/\/wallet\/failed\?payment=/, { timeout: NAV });
  await expect(v(page.getByText(/No money was taken/)).first()).toBeVisible();
  expect((await paymentFromUrl(page)).status).toMatch(/failed|cancelled/);
  expect(await balance(page.request)).toBe(before);
});

test("the server computes credits: a custom amount below BDT 50 is refused", async ({
  page,
}) => {
  const res = await page.request.post("/api/payments", {
    data: { kind: "topup", method: "bkash", customBdt: 49 },
  });
  expect(res.status()).toBe(400);
  const ok = await page.request.post("/api/payments", {
    data: { kind: "topup", method: "nagad", customBdt: 50 },
  });
  expect(ok.status()).toBe(201);
  expect((await ok.json()).payment).toMatchObject({
    credits: 5_000,
    bonusCredits: 0,
    status: "pending",
  });
});

test("Go Pro: plan, renewal date and 159,900 credits", async ({ page }) => {
  test.setTimeout(60_000);
  await newPhoneUser(page);
  const before = await balance(page.request);
  await page.goto("/wallet");
  if (isMobile(page)) {
    await v(page.getByRole("button", { name: "Upgrade" }))
      .first()
      .click();
    await v(page.getByRole("button", { name: "Upgrade with bKash" })).click();
  } else {
    await v(page.getByRole("button", { name: "Upgrade Now" })).click();
    await v(
      page.getByRole("button", { name: /Upgrade with bKash · ৳1,599/ }),
    ).click();
  }
  await expect(v(page.getByText("You’re on Pro")).first()).toBeVisible({
    timeout: NAV,
  });
  const wallet = (await (await page.request.get("/api/wallet")).json()) as {
    plan: string;
    proRenewsAt: string;
    balance: { credits: number };
  };
  expect(wallet.plan).toBe("pro");
  expect(new Date(wallet.proRenewsAt).getTime()).toBeGreaterThan(
    Date.now() + 27 * 86_400_000,
  );
  expect(wallet.balance.credits).toBe(before + 159_900);
});

test("Usage shows this month's charges from the ledger", async ({ page }) => {
  const usage = (await (
    await page.request.get("/api/usage?period=this-month")
  ).json()) as {
    spent: { credits: number };
    activity: { chat: string; credits: number }[];
  };
  expect(usage.spent.credits).toBeGreaterThan(0);
  expect(usage.activity.length).toBeGreaterThan(0);
  await page.goto("/settings/usage");
  // The demo user's spending moves while other tests run, so check the rows, not the total.
  await expect(
    v(page.getByText(usage.activity.at(-1)!.chat, { exact: true })).first(),
  ).toBeVisible({ timeout: NAV });
  await expect(v(page.getByText(/^[\d,.]+ credits$/)).first()).toBeVisible();
  const csv = await page.request.get("/api/usage/export?period=this-month");
  expect(csv.headers()["content-type"]).toContain("text/csv");
  expect(await csv.text()).toContain("Date");
});
