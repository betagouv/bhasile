import { expect, Page } from "@playwright/test";

import { TestStructureData } from "../../test-data";

export class SelectionPage {
  constructor(private page: Page) {}

  async waitForLoad(): Promise<void> {
    await expect(
      this.page.getByRole("heading", {
        name: "Quelle structure voulez-vous ajouter ?",
      })
    ).toBeVisible();
  }

  async selectStructure(data: TestStructureData): Promise<void> {
    await this.waitForLoad();
    await this.page.selectOption("#type", data.type);
    await this.selectOperateur(data.identification.operateur.searchTerm);
    await this.selectDepartement(
      data.adresses.adresseAdministrative.searchTerm
    );

    const structureLabel = this.page.locator(`label[for="${data.dnaCode}"]`);
    await expect(structureLabel).toBeVisible({ timeout: 10000 });
    await structureLabel.click();

    await this.page
      .getByRole("button", { name: "J’ai trouvé ma structure" })
      .click();
    await expect(this.page).toHaveURL(
      new RegExp(`/ajout-structure/${data.dnaCode}/01-identification`)
    );
  }

  private async selectOperateur(searchTerm: string): Promise<void> {
    await this.page.click('input[name="operateur.name"]');
    await this.page.fill('input[name="operateur.name"]', searchTerm);
    await this.page.waitForSelector("#suggestion-0", {
      state: "visible",
      timeout: 5000,
    });
    await this.page.click("#suggestion-0");
  }

  private async selectDepartement(searchTerm: string): Promise<void> {
    const departement = this.extractDepartement(searchTerm);
    await this.page.fill("#departement", departement);
    await this.page.waitForSelector("#suggestion-0", {
      state: "visible",
      timeout: 5000,
    });
    await this.page.click("#suggestion-0");
  }

  private extractDepartement(searchTerm: string): string {
    const match = searchTerm.match(/\d{5}/);
    if (!match) {
      return "75";
    }
    return match[0].slice(0, 2);
  }
}
