import { defineConfig, devices } from "@playwright/test";

const APP_URL = "http://localhost:3000";
const STORYBOOK_URL = "http://localhost:6006";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    trace: "on-first-retry",
  },
  projects: [
    // User flows from the Figma prototype, against the app.
    {
      name: "desktop",
      testDir: "./tests/e2e",
      use: { ...devices["Desktop Chrome"], baseURL: APP_URL },
    },
    {
      name: "mobile",
      testDir: "./tests/e2e",
      use: { ...devices["Pixel 7"], baseURL: APP_URL },
    },
    // Components vs Figma references, against Storybook. Figma exports are 2×.
    {
      name: "visual",
      testDir: "./tests/visual",
      use: {
        ...devices["Desktop Chrome"],
        baseURL: STORYBOOK_URL,
        deviceScaleFactor: 2,
      },
    },
  ],
  webServer: [
    {
      command: "npm run dev",
      url: APP_URL,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: "npm run storybook -- --ci",
      url: STORYBOOK_URL,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
