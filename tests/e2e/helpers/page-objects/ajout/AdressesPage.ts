import { Repartition } from "@/types/adresse.type";

import { TIMEOUTS, URLS } from "../../constants";
import { getRepartitionLabel } from "../../shared-utils";
import { TestStructureData } from "../../test-data";
import { BasePage } from "../BasePage";

export class AdressesPage extends BasePage {
  async fillForm(data: TestStructureData) {
    // Adresse administrative (autocomplete)
    await this.page.click('input[name="adresseAdministrativeComplete"]');
    await this.page.fill(
      'input[name="adresseAdministrativeComplete"]',
      data.adresseAdministrative.searchTerm
    );

    const firstSuggestion = this.page.locator('[role="option"]').first();
    await firstSuggestion.waitFor({
      state: "visible",
      timeout: TIMEOUTS.AUTOCOMPLETE,
    });
    await firstSuggestion.click();

    await this.page.waitForTimeout(TIMEOUTS.UI_UPDATE);

    // Type de bâti - select dropdown
    await this.page.selectOption(
      'select[name="typeBati"]',
      getRepartitionLabel(data.typeBati)
    );

    // Wait for the UI to update
    await this.page.waitForTimeout(TIMEOUTS.UI_UPDATE * 2);

    // Same address toggle (only for COLLECTIF)
    if (data.sameAddress && data.typeBati === Repartition.COLLECTIF) {
      await this.page.click('input[title="Adresse d\'hébergement identique"]');
      await this.page.waitForTimeout(TIMEOUTS.UI_UPDATE);
      await this.page.fill(
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
          await this.page.waitForTimeout(300);
        }

        await this.page.click(`input[name="adresses.${i}.adresseComplete"]`);
        await this.page.fill(
          `input[name="adresses.${i}.adresseComplete"]`,
          adresse.searchTerm
        );

        const addressSuggestion = this.page.locator('[role="option"]').first();
        await addressSuggestion.waitFor({
          state: "visible",
          timeout: TIMEOUTS.AUTOCOMPLETE,
        });
        await addressSuggestion.click();

        await this.page.waitForTimeout(TIMEOUTS.UI_UPDATE);

        await this.page.fill(
          `input[name="adresses.${i}.adresseTypologies.0.placesAutorisees"]`,
          adresse.placesAutorisees.toString()
        );

        // For MIXTE, set repartition per address
        if (data.typeBati === Repartition.MIXTE && adresse.repartition) {
          await this.page.selectOption(
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
