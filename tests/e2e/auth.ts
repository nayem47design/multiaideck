import { expect, type APIRequestContext, type Page } from "@playwright/test";

// Helpers for tests that sign in or out. Sign-in limits are per phone and per IP, so each test
// uses a fresh number and a fresh X-Forwarded-For.

/** Sign-in steps wait on the dev server (it compiles routes on first use and serves other runs). */
export const NAV = 20_000;

/** Start the test signed out (no demo session). */
export const signedOut = { storageState: { cookies: [], origins: [] } };

/** A random Bangladesh mobile number, national digits ("17xxxxxxxx"). */
export function randomPhone() {
  const rest = String(Math.floor(Math.random() * 1e8)).padStart(8, "0");
  return `17${rest}`;
}

export function randomIp() {
  const b = () => Math.floor(Math.random() * 250) + 1;
  return `10.${b()}.${b()}.${b()}`;
}

/** Fresh client IP for this page's requests, so repeated runs don't hit the per-IP limit. */
export async function freshIp(page: Page) {
  await page.setExtraHTTPHeaders({ "x-forwarded-for": randomIp() });
}

/** The code the console SMS provider "sent" (dev-only GET /api/dev/last-code). */
export async function lastCode(request: APIRequestContext, phone: string) {
  let code = "";
  await expect(async () => {
    const res = await request.get(`/api/dev/last-code?phone=${phone}`);
    expect(res.ok()).toBeTruthy();
    code = ((await res.json()) as { code: string }).code;
  }).toPass({ timeout: 5_000 });
  return code;
}

/** Sign in as the demo user with a session of this test's own (safe to sign out). */
export async function ownDemoSession(page: Page) {
  await page.context().clearCookies();
  const res = await page.request.post("/api/dev/sign-in-demo");
  expect(res.ok()).toBeTruthy();
}

/** Sign in as a brand-new phone user through the API (safe to delete). */
export async function newPhoneUser(page: Page) {
  // Signing in ends the browser's previous session; never let that be the shared demo session.
  await page.context().clearCookies();
  const phone = randomPhone();
  const headers = { "x-forwarded-for": randomIp() };
  const sent = await page.request.post("/api/auth/code", {
    data: { phone },
    headers,
  });
  expect(sent.ok(), await sent.text()).toBeTruthy();
  const code = await lastCode(page.request, phone);
  const verified = await page.request.post("/api/auth/verify", {
    data: { phone, code },
    headers,
  });
  expect(verified.ok(), await verified.text()).toBeTruthy();
  return phone;
}
