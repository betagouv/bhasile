import fs from "node:fs";
import path from "node:path";

import { chromium, type FullConfig } from "@playwright/test";

import { authenticateWithProConnect } from "./helpers/e2e-proconnect-login";

async function globalSetup(config: FullConfig): Promise<void> {
  const password = process.env.E2E_AGENT_PASSWORD;
  const email = process.env.E2E_AGENT_EMAIL;
  const baseURL =
    config.projects[0]?.use?.baseURL ??
    process.env.E2E_BASE_URL ??
    "http://localhost:3000";

  if (!password || !email) {
    throw new Error(
      "E2E_AGENT_EMAIL and E2E_AGENT_PASSWORD must be set for Playwright global setup (ProConnect login)."
    );
  }

  const authDir = path.join(process.cwd(), "playwright/.auth");
  const authFile = path.join(authDir, "agent.json");
  fs.mkdirSync(authDir, { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext({
    baseURL,
    ignoreHTTPSErrors: true,
  });
  const page = await context.newPage();
  await authenticateWithProConnect(page, { email, password });

  await context.storageState({ path: authFile });
  await browser.close();
}

export default globalSetup;
