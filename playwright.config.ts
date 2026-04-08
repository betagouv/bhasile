import "dotenv/config";

import { defineConfig } from "@playwright/test";

const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./tests/e2e",
  globalSetup: "./tests/e2e/global-setup.ts",
  timeout: 45000,
  workers: 1, // Run tests sequentially to avoid race conditions
  use: {
    baseURL,
    headless: true,
    viewport: { width: 1600, height: 800 },
    ignoreHTTPSErrors: true,
    storageState: "playwright/.auth/agent.json",
    video: "retain-on-failure",
    screenshot: "only-on-failure",
  },
});
