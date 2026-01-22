import { Page } from "@playwright/test";
import { expect } from "@playwright/test";

import { AutocompleteHelper } from "../../autocomplete-helper";
import { FormHelper } from "../../form-helper";
import { TIMEOUTS } from "../../constants";
import { TestStructureData } from "../../test-data/types";
import { BasePage } from "../BasePage";

export class SelectionPage extends BasePage {
  private autocompleteHelper: AutocompleteHelper;
  private formHelper: FormHelper;

  constructor(page: Page) {
    super(page);
    this.autocompleteHelper = new AutocompleteHelper(page);
    this.formHelper = new FormHelper(page);
  }

  override async waitForLoad(): Promise<void> {
    await expect(
      this.page.getByRole("heading", {
        name: "Quelle structure voulez-vous ajouter ?",
      })
    ).toBeVisible();
  }

  async selectStructure(data: TestStructureData): Promise<void> {
    await this.waitForLoad();
    await this.formHelper.selectOption("#type", data.type);
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
    await this.autocompleteHelper.fillAndSelectByText(
      'input[name="operateur.name"]',
      searchTerm,
      operateurName
    );
  }

  private async selectDepartement(departement: string): Promise<void> {
    await this.autocompleteHelper.fillAndSelectFirst(
      "#departement",
      departement,
      "#suggestion-0"
    );
  }
}
