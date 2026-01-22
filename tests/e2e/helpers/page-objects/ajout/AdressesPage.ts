import { Page } from "@playwright/test";

import { Repartition } from "@/types/adresse.type";

import { AutocompleteHelper } from "../../autocomplete-helper";
import { URLS } from "../../constants";
import { FormHelper } from "../../form-helper";
import { SELECTORS } from "../../selectors";
import { getRepartitionLabel } from "../../shared-utils";
import { TestStructureData } from "../../test-data/types";
import { WaitHelper } from "../../wait-helper";
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

  async fillForm(data: Partial<TestStructureData>) {
    if (data.adresseAdministrative) {
      await this.autocompleteHelper.fillAndSelectFirst(
        SELECTORS.ADRESSE_ADMINISTRATIVE_COMPLETE,
        data.adresseAdministrative.searchTerm
      );

      await this.waitHelper.waitForUIUpdate();
    }

    if (data.typeBati) {
      await this.formHelper.selectOption(
        'select[name="typeBati"]',
        getRepartitionLabel(data.typeBati)
      );
    }

    if (data.typeBati) {
      await this.waitHelper.waitForUIUpdate(2);
    }

    if (
      data.sameAddress &&
      data.typeBati === Repartition.COLLECTIF &&
      data.structureTypologies &&
      data.structureTypologies.length > 0
    ) {
      await this.formHelper.toggleSwitch(
        'input[title="Adresse d\'hébergement identique"]',
        true
      );
      await this.formHelper.fillInput(
        'input[name="adresses.0.adresseTypologies.0.placesAutorisees"]',
        data.structureTypologies[0].placesAutorisees.toString()
      );
    } else if (data.adresses) {
      for (const [i, adresse] of data.adresses.entries()) {
        if (i > 0) {
          await this.page
            .getByRole("button", { name: /Ajouter un hébergement/i })
            .click();
          await this.waitHelper.waitForUIUpdate();
        }

        await this.autocompleteHelper.fillAndSelectFirst(
          SELECTORS.ADRESSE_COMPLETE(i),
          adresse.searchTerm
        );

        await this.waitHelper.waitForUIUpdate();

        await this.formHelper.fillInput(
          `input[name="adresses.${i}.adresseTypologies.0.placesAutorisees"]`,
          adresse.placesAutorisees.toString()
        );

        if (data.typeBati === Repartition.MIXTE && adresse.repartition) {
          await this.formHelper.selectOption(
            `select[name="adresses.${i}.repartition"]`,
            getRepartitionLabel(adresse.repartition)
          );
        }
      }
    }
  }

  async submit(dnaCode: string, expectValidationFailure = false) {
    if (expectValidationFailure) {
      await this.submitAndExpectNoNavigation();
    } else {
      await this.submitAndWaitForUrl(URLS.ajoutStep(dnaCode, "03-type-places"));
    }
  }
}
