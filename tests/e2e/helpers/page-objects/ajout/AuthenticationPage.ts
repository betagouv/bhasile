import { Page } from "@playwright/test";

import { TIMEOUTS, URLS } from "../../constants";
import { formatErrorMessage } from "../../error-handler";
import { FormHelper } from "../../form-helper";
import { BasePage } from "../BasePage";

export class AuthenticationPage extends BasePage {
  private formHelper: FormHelper;

  constructor(page: Page) {
    super(page);
    this.formHelper = new FormHelper(page);
  }

  async authenticate() {
    await this.page.goto(URLS.AJOUT_STRUCTURE, {
      waitUntil: "domcontentloaded",
    });

    const passwordInput = await this.page
      .locator('input[type="password"]')
      .count();

    const password =
      process.env.OPERATEUR_PASSWORD?.split(",")[0] ||
      process.env.OPERATEUR_PASSWORDS?.split(",")[0];

    if (passwordInput > 0) {
      if (!password) {
        throw new Error(
          formatErrorMessage(
            "OPERATEUR_PASSWORDS must be set for e2e authentication",
            "AuthenticationPage.authenticate"
          )
        );
      }
      await this.formHelper.fillInput('input[type="password"]', password);
      await this.page.click("button.fr-btn");

      await this.page.waitForURL(URLS.AJOUT_STRUCTURE, {
        timeout: TIMEOUTS.SUBMIT,
      });
    }

    await this.page.waitForSelector('a[href="/ajout-structure/selection"]', {
      state: "visible",
      timeout: TIMEOUTS.AUTOCOMPLETE,
    });
  }
}
