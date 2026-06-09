import "dotenv/config";

import { defineConfig } from "@playwright/test";

const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3000";

const parsedWorkers = Number(process.env.E2E_WORKERS);
const workers =
  Number.isInteger(parsedWorkers) && parsedWorkers > 0 ? parsedWorkers : 5;

export default defineConfig({
  testDir: ".",
  testMatch: ["specs/**/*.spec.ts"],
  globalSetup: "./global-setup.ts",
  timeout: 30000,
  expect: { timeout: 10000 },
  fullyParallel: true,
  workers,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    headless: true,
    viewport: { width: 1600, height: 800 },
    ignoreHTTPSErrors: true,
    storageState: "playwright/.auth/agent.json",
    video: "retain-on-failure",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
});
