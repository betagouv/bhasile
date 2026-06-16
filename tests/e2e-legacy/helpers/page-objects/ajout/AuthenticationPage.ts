import { Page } from "@playwright/test";

import { TIMEOUTS, URLS } from "../../constants";
import { formatErrorMessage } from "../../error-handler";
import { BasePage } from "../BasePage";

export class AuthenticationPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async authenticate() {
    await this.page.goto(URLS.AJOUT_STRUCTURE, {
      waitUntil: "domcontentloaded",
    });

    const password = process.env.OPERATEUR_PASSWORDS?.split(",")[0];

    if (!password) {
      throw new Error(
        formatErrorMessage(
          "OPERATEUR_PASSWORDS must be set for e2e authentication",
          "AuthenticationPage.authenticate"
        )
      );
    }

    const passwordField = this.page.getByRole("textbox", {
      name: "Mot de passe",
    });
    await passwordField.waitFor({
      state: "visible",
      timeout: TIMEOUTS.NAVIGATION,
    });
    await passwordField.fill(password);
    await this.page.getByRole("button", { name: "Valider" }).click();

    await this.page.waitForURL(URLS.AJOUT_STRUCTURE, {
      timeout: TIMEOUTS.SUBMIT,
    });

    await this.page.waitForSelector('a[href="/ajout-structure/selection"]', {
      state: "visible",
      timeout: TIMEOUTS.AUTOCOMPLETE,
    });
  }
}
