import { Page } from "@playwright/test";
import { Repartition } from "@/types/adresse.type";

import { AutocompleteHelper } from "../../autocomplete-helper";
import { FormHelper } from "../../form-helper";
import { WaitHelper } from "../../wait-helper";
import { URLS } from "../../constants";
import { getRepartitionLabel } from "../../shared-utils";
import { TestStructureData } from "../../test-data/types";
import { BasePage } from "../BasePage";

export class AdressesPage extends BasePage {
  private autocompleteHelper: AutocompleteHelper;
  private formHelper: FormHelper;
  private waitHelper: WaitHelper;

  constructor(page: Page) {
    super(page);
    this.autocompleteHelper = new AutocompleteHelper(page);
    this.formHelper = new FormHelper(page);
    this.waitHelper = new WaitHelper(page);
  }

  async fillForm(data: TestStructureData) {
    // Adresse administrative (autocomplete)
    await this.autocompleteHelper.fillAndSelectFirst(
      'input[name="adresseAdministrativeComplete"]',
      data.adresseAdministrative.searchTerm
    );

    await this.waitHelper.waitForUIUpdate();

    // Type de bâti - select dropdown
    await this.formHelper.selectOption(
      'select[name="typeBati"]',
      getRepartitionLabel(data.typeBati)
    );

    // Wait for the UI to update
    await this.waitHelper.waitForUIUpdate(2);

    // Same address toggle (only for COLLECTIF)
    if (data.sameAddress && data.typeBati === Repartition.COLLECTIF) {
      await this.formHelper.toggleSwitch(
        'input[title="Adresse d\'hébergement identique"]',
        true
      );
      await this.formHelper.fillInput(
        'input[name="adresses.0.adresseTypologies.0.placesAutorisees"]',
        data.structureTypologies[0].placesAutorisees.toString()
      );
    } else if (data.adresses) {
      // Fill addresses
      for (const [i, adresse] of data.adresses.entries()) {
        if (i > 0) {
          await this.page
            .getByRole("button", { name: /Ajouter un hébergement/i })
            .click();
          await this.waitHelper.waitForUIUpdate();
        }

        await this.autocompleteHelper.fillAndSelectFirst(
          `input[name="adresses.${i}.adresseComplete"]`,
          adresse.searchTerm
        );

        await this.waitHelper.waitForUIUpdate();

        await this.formHelper.fillInput(
          `input[name="adresses.${i}.adresseTypologies.0.placesAutorisees"]`,
          adresse.placesAutorisees.toString()
        );

        // For MIXTE, set repartition per address
        if (data.typeBati === Repartition.MIXTE && adresse.repartition) {
          await this.formHelper.selectOption(
            `select[name="adresses.${i}.repartition"]`,
            getRepartitionLabel(adresse.repartition)
          );
        }
      }
    }
  }

  async submit(dnaCode: string) {
    await this.submitAndWaitForUrl(URLS.ajoutStep(dnaCode, "03-type-places"));
  }
}
