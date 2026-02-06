import "dotenv/config";

import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 45000,
  workers: 1, // Run tests sequentially to avoid race conditions
  use: {
    baseURL: "http://localhost:3000",
    headless: true,
    viewport: { width: 1600, height: 800 },
    ignoreHTTPSErrors: true,
    extraHTTPHeaders: {
      "x-dev-auth-bypass": "1",
    },
    video: "retain-on-failure",
    screenshot: "only-on-failure",
  },
});
