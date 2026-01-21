import { expect } from "@playwright/test";

import { TIMEOUTS } from "../../constants";
import { TestStructureData } from "../../test-data";
import { BasePage } from "../BasePage";

export class SelectionPage extends BasePage {
  override async waitForLoad(): Promise<void> {
    await expect(
      this.page.getByRole("heading", {
        name: "Quelle structure voulez-vous ajouter ?",
      })
    ).toBeVisible();
  }

  async selectStructure(data: TestStructureData): Promise<void> {
    await this.waitForLoad();
    await this.page.selectOption("#type", data.type);
    await this.selectOperateur(data.operateur.searchTerm, data.operateur.name);
    const departement = data.departementAdministratif;
    await this.selectDepartement(departement);

    const structureLabel = this.page.locator(`label[for="${data.dnaCode}"]`);
    await expect(structureLabel).toBeVisible({ timeout: TIMEOUTS.NAVIGATION });
    await structureLabel.click();

    const continueButton = this.page.getByRole("button", {
      name: /J.?ai trouvé ma structure/i,
    });
    await expect(continueButton).toBeEnabled({
      timeout: TIMEOUTS.NAVIGATION,
    });
    await continueButton.click();
    await expect(this.page).toHaveURL(
      new RegExp(`/ajout-structure/${data.dnaCode}/01-identification`)
    );
  }

  private async selectOperateur(
    searchTerm: string,
    operateurName: string
  ): Promise<void> {
    await this.page.click('input[name="operateur.name"]');
    await this.page.fill('input[name="operateur.name"]', searchTerm);
    const suggestion = this.page.getByRole("option", {
      name: operateurName,
    });
    await expect(suggestion).toBeVisible({ timeout: TIMEOUTS.AUTOCOMPLETE });
    await suggestion.click();
  }

  private async selectDepartement(departement: string): Promise<void> {
    await this.page.fill("#departement", departement);
    await this.page.waitForSelector("#suggestion-0", {
      state: "visible",
      timeout: TIMEOUTS.AUTOCOMPLETE,
    });
    await this.page.click("#suggestion-0");
  }
}
