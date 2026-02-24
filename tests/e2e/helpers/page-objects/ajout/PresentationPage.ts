import { expect } from "@playwright/test";

import { BasePage } from "../BasePage";

export class PresentationPage extends BasePage {
  private async verifyPageContent(): Promise<void> {
    await expect(
      this.page
        .locator("h2")
        .filter({ hasText: "Vous allez créer la page dédiée" })
    ).toBeVisible();

    await expect(
      this.page.getByRole("link", {
        name: "Je commence à remplir le formulaire",
      })
    ).toBeVisible();
  }

  private async startForm(): Promise<void> {
    await this.page
      .getByRole("link", { name: "Je commence à remplir le formulaire" })
      .click();
  }

  async navigateToSelectionStep(): Promise<void> {
    await this.verifyPageContent();
    await this.startForm();
    await expect(this.page).toHaveURL(new RegExp(`/ajout-structure/selection`));
  }
}
