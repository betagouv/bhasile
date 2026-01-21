import { expect, Page } from "@playwright/test";

import { TIMEOUTS } from "../../constants";

export class ConfirmationPage {
  constructor(private page: Page) {}

  async verifySuccess() {
    // Wait for confirmation message or success indicator
    await expect(
      this.page.getByRole("heading", {
        name: /Vous avez terminé la création de cette structure/i,
      })
    ).toBeVisible({ timeout: TIMEOUTS.NAVIGATION });

    // Also check for success icon
    await expect(this.page.locator(".fr-icon-success-line")).toBeVisible();
  }
}
