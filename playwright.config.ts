import { defineConfig, devices } from "@playwright/test";

const APP_URL = "http://localhost:3000";
/** Cookies of the demo user, written by tests/e2e/auth.setup.ts (git-ignored). */
export const DEMO_STATE = "playwright/.auth/demo.json";
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
    // Signs in as the demo user (POST /api/dev/sign-in-demo) once; the e2e projects start from
    // that session. Tests that sign out or test sign-in start their own (see tests/e2e/auth.ts).
    {
      name: "e2e-setup",
      testDir: "./tests/e2e",
      testMatch: /auth\.setup\.ts/,
      use: { baseURL: APP_URL },
    },
    // User flows from the Figma prototype, against the app.
    {
      name: "desktop",
      testDir: "./tests/e2e",
      // Figma's desktop frames are 1440×900.
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
        baseURL: APP_URL,
        storageState: DEMO_STATE,
      },
      dependencies: ["e2e-setup"],
    },
    {
      name: "mobile",
      testDir: "./tests/e2e",
      use: {
        ...devices["Pixel 7"],
        baseURL: APP_URL,
        storageState: DEMO_STATE,
      },
      dependencies: ["e2e-setup"],
    },
    // Components vs Figma references, against Storybook. Figma exports are 2×.
    {
      name: "visual",
      testDir: "./tests/visual",
      testIgnore: "screens.spec.ts",
      use: {
        ...devices["Desktop Chrome"],
        baseURL: STORYBOOK_URL,
        deviceScaleFactor: 2,
      },
    },
    // Whole screens vs Figma Prototype frames, against the app (each test sets its own viewport).
    {
      name: "screens",
      testDir: "./tests/visual",
      testMatch: "screens.spec.ts",
      use: { baseURL: APP_URL },
    },
    // Accessibility, keyboard and reduced-motion checks, against the app.
    {
      name: "a11y",
      testDir: "./tests/a11y",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
        baseURL: APP_URL,
        storageState: DEMO_STATE,
      },
      dependencies: ["e2e-setup"],
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
