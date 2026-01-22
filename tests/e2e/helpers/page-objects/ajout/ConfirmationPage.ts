import { BasePage } from "../BasePage";

export class ConfirmationPage extends BasePage {
  async verifySuccess() {
    await this.waitForHeading(
      /Vous avez terminé la création de cette structure/i
    );

    const { expect } = await import("@playwright/test");
    await expect(this.page.locator(".fr-icon-success-line")).toBeVisible();
  }
}
