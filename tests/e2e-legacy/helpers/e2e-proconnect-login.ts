import type { Page } from "@playwright/test";

export type ProConnectCredentials = {
  email: string;
  password: string;
};

export async function authenticateWithProConnect(
  page: Page,
  credentials: ProConnectCredentials
): Promise<void> {
  const { email, password } = credentials;

  await page.goto("/connexion", { waitUntil: "domcontentloaded" });
  await page
    .getByRole("button", { name: /S.identifier avec|ProConnect/i })
    .click();

  await page.waitForURL(
    (url) => {
      const host = url.hostname;
      return host !== "localhost" && host !== "127.0.0.1";
    },
    { timeout: 60000 }
  );

  const emailField = page
    .locator(
      [
        'input[type="email"]',
        'input[name="username"]',
        "input#username",
        'input[name="login"]',
        'input[autocomplete="username"]',
      ].join(", ")
    )
    .first();
  await emailField.waitFor({ state: "visible", timeout: 60000 });
  await emailField.fill(email);

  const passwordLocator = page.locator('input[type="password"]').first();

  if (await passwordLocator.isVisible().catch(() => false)) {
    await passwordLocator.fill(password);
    await clickPrimaryLoginSubmit(page);
  } else {
    const nextBtn = page.getByRole("button", {
      name: /suivant|continuer|next/i,
    });
    if (await nextBtn.isVisible().catch(() => false)) {
      await nextBtn.click();
    }
    await passwordLocator.waitFor({ state: "visible", timeout: 60000 });
    await passwordLocator.fill(password);
    await clickPrimaryLoginSubmit(page);
  }

  await maybeClickOAuthConsent(page);

  const appOrigin = process.env.NEXT_PUBLIC_URL ?? "http://localhost:3000";
  const appHost = new URL(appOrigin).hostname;

  await page.waitForURL(
    (url) =>
      url.hostname === appHost &&
      (url.pathname.includes("/structures") ||
        url.pathname.startsWith("/api/auth/callback")),
    { timeout: 120000 }
  );

  if (page.url().includes("/api/auth/callback")) {
    await page.waitForURL(
      (url) => url.hostname === appHost && url.pathname.includes("/structures"),
      { timeout: 120000 }
    );
  }
}

async function clickPrimaryLoginSubmit(page: Page): Promise<void> {
  const submit = page.getByRole("button", {
    name: /connexion|valider|s.identifier|se connecter|continuer/i,
  });
  const count = await submit.count();
  if (count > 0) {
    await submit.first().click();
    return;
  }
  await page
    .locator('button[type="submit"], input[type="submit"]')
    .first()
    .click();
}

async function maybeClickOAuthConsent(page: Page): Promise<void> {
  const consent = page.getByRole("button", {
    name: /autoriser|continuer|accepter|j.autorise/i,
  });
  try {
    await consent.first().waitFor({ state: "visible", timeout: 12000 });
    await consent.first().click();
  } catch {
    // No consent step (or already on app callback).
  }
}
