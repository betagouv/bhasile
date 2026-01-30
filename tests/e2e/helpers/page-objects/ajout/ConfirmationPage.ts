import { expect } from "@playwright/test";

import { BasePage } from "../BasePage";
export class ConfirmationPage extends BasePage {
  async verifySuccess() {
    await this.waitForHeading(
      /Vous avez terminé la création de cette structure/i,
      1
    );

    await expect(this.page.locator(".fr-icon-success-line")).toBeVisible();
  }
}
