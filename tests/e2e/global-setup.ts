import fs from "node:fs";
import path from "node:path";

import { chromium, type FullConfig } from "@playwright/test";

import { authenticateWithProConnect } from "./proconnect-login";
import { cleanupOrphans } from "./seed/orphan-cleanup";

// ProConnect émet des sessions valides 12h
// (https://partenaires.proconnect.gouv.fr/docs/fournisseur-service/implementation_technique).
const AUTH_TTL_MS = 12 * 60 * 60 * 1000;

async function globalSetup(config: FullConfig): Promise<void> {
  await cleanupOrphans();

  const email = process.env.E2E_AGENT_EMAIL;
  const password = process.env.E2E_AGENT_PASSWORD;
  const baseURL =
    config.projects[0]?.use?.baseURL ??
    process.env.E2E_BASE_URL ??
    "http://localhost:3000";

  if (!email || !password) {
    throw new Error(
      "E2E_AGENT_EMAIL et E2E_AGENT_PASSWORD doivent être définis pour le global setup e2e."
    );
  }

  const authDir = path.join(process.cwd(), "playwright/.auth");
  const authFile = path.join(authDir, "agent.json");
  fs.mkdirSync(authDir, { recursive: true });

  if (isAuthFileUsable(authFile)) {
    console.log(
      "Authentification ProConnect ignorée (fichier d'auth réutilisable)"
    );
    return;
  }

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

const isAuthFileUsable = (authFile: string): boolean => {
  if (!fs.existsSync(authFile)) {
    return false;
  }
  const stat = (() => {
    try {
      return fs.statSync(authFile);
    } catch {
      return undefined;
    }
  })();
  if (!stat || Date.now() - stat.mtimeMs >= AUTH_TTL_MS) {
    return false;
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(authFile, "utf8")) as unknown;
    return (
      typeof parsed === "object" &&
      parsed !== null &&
      Array.isArray((parsed as { cookies?: unknown }).cookies)
    );
  } catch {
    return false;
  }
};

export default globalSetup;
