import { expect, test as setup } from "@playwright/test";

import { DEMO_STATE } from "../../playwright.config";

// Every e2e test starts signed in as the demo user (the coffee-shop chat, 10,684 credits).
setup("sign in as the demo user", async ({ request }) => {
  const res = await request.post("/api/dev/sign-in-demo");
  expect(res.ok(), await res.text()).toBeTruthy();
  await request.storageState({ path: DEMO_STATE });
});
