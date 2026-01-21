import { TIMEOUTS } from "../../constants";
import { BasePage } from "../BasePage";

export class ConfirmationPage extends BasePage {

  async verifySuccess() {
    // Wait for confirmation message or success indicator
    await this.waitForHeading(
      /Vous avez terminé la création de cette structure/i
    );

    // Also check for success icon
    const { expect } = await import("@playwright/test");
    await expect(this.page.locator(".fr-icon-success-line")).toBeVisible();
  }
}
