import "dotenv/config";

import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "@playwright/test";

const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3000";

// `webServer.cwd` vaut par défaut le dossier de ce fichier, où `yarn start`
// ne trouverait pas `.next/standalone/server.js`.
const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../.."
);

const parsedWorkers = Number(process.env.E2E_WORKERS);
const workers =
  Number.isInteger(parsedWorkers) && parsedWorkers > 0 ? parsedWorkers : 5;

export default defineConfig({
  testDir: ".",
  testMatch: ["specs/**/*.spec.ts"],
  globalSetup: "./global-setup.ts",
  timeout: 90000,
  expect: { timeout: 10000 },
  fullyParallel: true,
  workers,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  webServer: process.env.CI
    ? {
        command: "yarn start",
        cwd: repoRoot,
        url: baseURL,
        timeout: 120_000,
        reuseExistingServer: false,
      }
    : undefined,
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
