import { defineConfig, devices } from "@playwright/test";

const HALOP_URL = process.env.HALOP_URL ?? "http://localhost:9090";

export default defineConfig({
  testDir: "./src/tests",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [
    ["list"],
    ["html", { open: "never" }],
    ...(process.env.CI ? [["junit", { outputFile: "test-results/junit.xml" }] as const] : []),
  ],
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: HALOP_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  globalSetup: "./global-setup.ts",
  globalTeardown: "./global-teardown.ts",
});
