import { expect, Page } from "@playwright/test";

export class PresentationPage {
  constructor(private page: Page) {}

  async verifyPageContent(): Promise<void> {
    // Vérifier que la page de présentation est bien affichée
    await expect(
      this.page
        .locator("h2")
        .filter({ hasText: "Vous allez créer la page dédiée" })
    ).toBeVisible();

    // Vérifier la présence du bouton principal
    await expect(
      this.page.locator('text="Je commence à remplir le formulaire"')
    ).toBeVisible();
  }

  async startForm(): Promise<void> {
    // Cliquer sur le bouton pour commencer le formulaire
    await this.page
      .locator('text="Je commence à remplir le formulaire"')
      .click();
  }

  async navigateToSelectionStep(): Promise<void> {
    // Vérifier le contenu de la page
    await this.verifyPageContent();

    // Commencer le formulaire
    await this.startForm();

    // Vérifier qu'on arrive bien sur l'étape de sélection
    await expect(this.page).toHaveURL(
      new RegExp(`/ajout-structure/selection`)
    );
  }
}
