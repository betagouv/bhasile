import { Page } from "@playwright/test";

export class AuthenticationPage {
  constructor(private page: Page) {}

  async authenticate() {
    await this.page.goto("http://localhost:3000/ajout-structure", {
      waitUntil: "domcontentloaded",
    });

    // Check if auth is bypassed (DEV_AUTH_BYPASS=1)
    const passwordInput = await this.page
      .locator('input[type="password"]')
      .count();

    const password =
      process.env.OPERATEUR_PASSWORD?.split(",")[0] ||
      process.env.OPERATEUR_PASSWORDS?.split(",")[0];

    if (passwordInput > 0) {
      if (!password) {
        throw new Error("OPERATEUR_PASSWORDS must be set for e2e auth");
      }
      // Password protection is active - authenticate
      await this.page.fill('input[type="password"]', password);
      await this.page.click("button.fr-btn");

      // Wait for the page to load after authentication
      await this.page.waitForURL("http://localhost:3000/ajout-structure", {
        timeout: 15000,
      });
    } else {
      // Auth is bypassed - just wait for the form to load
      await this.page.waitForTimeout(1000);
    }
  }
}
