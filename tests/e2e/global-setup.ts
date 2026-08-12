import fs from "node:fs";
import path from "node:path";

import type { FullConfig } from "@playwright/test";
import { encode } from "next-auth/jwt";

import { E2E_AGENT_EMAIL, E2E_AGENT_NAME, seedAgent } from "./seed/agent.seed";
import { cleanupOrphans } from "./seed/orphan-cleanup";

const SESSION_MAX_AGE_SECONDS = 24 * 60 * 60;

async function globalSetup(config: FullConfig): Promise<void> {
  await cleanupOrphans();
  await seedAgent();

  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET doit être défini pour le global setup e2e.");
  }

  const baseURL =
    config.projects[0]?.use?.baseURL ??
    process.env.E2E_BASE_URL ??
    "http://localhost:3000";

  // Reproduit la dérivation de next-auth (`getToken`) : le nom du cookie dépend
  // de NEXTAUTH_URL, pas de l'URL visée par les tests.
  const isSecureCookie =
    process.env.NEXTAUTH_URL?.startsWith("https://") ?? !!process.env.VERCEL;

  const sessionToken = await encode({
    token: {
      sub: E2E_AGENT_EMAIL,
      email: E2E_AGENT_EMAIL,
      name: E2E_AGENT_NAME,
      prenom: "E2E",
      nom: "Agent",
    },
    secret,
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  const storageState = {
    cookies: [
      {
        name: isSecureCookie
          ? "__Secure-next-auth.session-token"
          : "next-auth.session-token",
        value: sessionToken,
        domain: new URL(baseURL).hostname,
        path: "/",
        expires: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS,
        httpOnly: true,
        secure: isSecureCookie,
        sameSite: "Lax" as const,
      },
    ],
    origins: [],
  };

  const authFile = path.join(process.cwd(), "playwright/.auth/agent.json");
  fs.mkdirSync(path.dirname(authFile), { recursive: true });
  fs.writeFileSync(authFile, JSON.stringify(storageState, null, 2));
}

export default globalSetup;
