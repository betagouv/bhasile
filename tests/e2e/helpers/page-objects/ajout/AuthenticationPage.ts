import { Page } from "@playwright/test";

import { TIMEOUTS, URLS } from "../../constants";

export class AuthenticationPage {
  constructor(private page: Page) {}

  async authenticate() {
    await this.page.goto(URLS.AJOUT_STRUCTURE, {
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
      await this.page.waitForURL(URLS.AJOUT_STRUCTURE, {
        timeout: TIMEOUTS.SUBMIT,
      });
    }

    // Wait for the presentation page to be ready (the "start form" link)
    await this.page.waitForSelector('a[href="/ajout-structure/selection"]', {
      state: "visible",
      timeout: TIMEOUTS.AUTOCOMPLETE,
    });
  }
}
