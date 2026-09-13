import { defineConfig, devices } from "@playwright/test";

// Existing helpers read PLAYWRIGHT_BASE_URL directly; set the one canonical
// local origin before Playwright creates worker processes.
process.env.PLAYWRIGHT_BASE_URL ??= "http://127.0.0.1:3000";
const baseURL = process.env.PLAYWRIGHT_BASE_URL;
const port = new URL(baseURL).port || "3000";

export default defineConfig({
  testDir: "./tests/browser",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "playwright-report/browser" }],
    ["json", { outputFile: "playwright-report/browser/results.json" }],
  ],
  outputDir: "test-results/browser",
  use: {
    baseURL,
    serviceWorkers: "block",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
  ],
  webServer: {
    command: `npm run dev -- --hostname 127.0.0.1 --port ${port}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    env: {
      NEXT_PUBLIC_API_BASE_PATH: "/api/",
    },
  },
});
