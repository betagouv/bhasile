import { Repartition } from "@/types/adresse.type";

import { TIMEOUTS, URLS } from "../../constants";
import { getRepartitionLabel } from "../../shared-utils";
import { TestStructureData } from "../../test-data";
import { BasePage } from "../BasePage";

export class AdressesPage extends BasePage {
  async fillForm(data: TestStructureData) {
    // Nom (should already be filled via selection page)
    if (data.nom) {
      const inputValue = await this.page.inputValue('input[name="nom"]');
      if (inputValue !== data.nom) {
        throw new Error(
          `Expected input[name="nom"] to have value "${data.nom}", but got "${inputValue}".`
        );
      }
    }

    // Adresse administrative (autocomplete)
    await this.page.click('input[name="adresseAdministrativeComplete"]');
    await this.page.fill(
      'input[name="adresseAdministrativeComplete"]',
      data.adresseAdministrative.searchTerm
    );

    // Wait for autocomplete suggestions (fail if not visible).
    const firstSuggestion = this.page.locator('[role="option"]').first();
    await firstSuggestion.waitFor({
      state: "visible",
      timeout: TIMEOUTS.AUTOCOMPLETE,
    });
    await firstSuggestion.click();

    // Wait for address to be populated
    await this.page.waitForTimeout(TIMEOUTS.UI_UPDATE);

    // Type de bâti - select dropdown
    // IMPORTANT: Select typeBati BEFORE filling addresses to ensure repartition is set correctly
    await this.page.selectOption(
      'select[name="typeBati"]',
      getRepartitionLabel(data.typeBati)
    );

    // Wait for the UI to update after selecting type de bâti
    // When typeBati changes, the form's handleTypeBatiChange updates addresses' repartition
    // For COLLECTIF, the form limits addresses to 1 and sets repartition automatically
    // For DIFFUS, the form sets repartition automatically
    // For MIXTE, repartition must be set per address
    // Wait longer to ensure the form has fully processed the change
    await this.page.waitForTimeout(TIMEOUTS.UI_UPDATE * 3);

    // Verify that addresses array is correctly initialized
    // When typeBati is COLLECTIF, there should be exactly 1 address
    if (data.typeBati === Repartition.COLLECTIF) {
      // Wait for the form to ensure only 1 address exists
      const addressCount = await this.page
        .locator('input[name^="adresses."][name$=".adresseComplete"]')
        .count();
      // Should have exactly 1 address for COLLECTIF
      if (addressCount > 1) {
        throw new Error(
          `Expected 1 address for COLLECTIF typeBati, but found ${addressCount}`
        );
      }
    }

    // Same address toggle (only for COLLECTIF)
    if (data.sameAddress && data.typeBati === Repartition.COLLECTIF) {
      // Click the toggle switch
      await this.page.click('input[title="Adresse d\'hébergement identique"]');

      // Wait for the address to be auto-filled
      await this.page.waitForTimeout(TIMEOUTS.UI_UPDATE);

      // Fill places autorisées in the auto-filled address
      // The first address should now be populated
      await this.page.fill(
        'input[name="adresses.0.adresseTypologies.0.placesAutorisees"]',
        data.structureTypologies[0].placesAutorisees.toString()
      );
    } else if (data.adresses) {
      // Handle multiple addresses (not same address)
      for (const [i, adresse] of data.adresses.entries()) {
        if (i > 0) {
          // Click "Add address" button for additional addresses
          await this.page
            .getByRole("button", { name: /Ajouter un hébergement/i })
            .click();
          await this.page.waitForTimeout(300);
        }

        // Fill address autocomplete
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

        // Fill places autorisées
        await this.page.fill(
          `input[name="adresses.${i}.adresseTypologies.0.placesAutorisees"]`,
          adresse.placesAutorisees.toString()
        );

        // For MIXTE, repartition field is visible and must be set per address
        // For COLLECTIF and DIFFUS, repartition is automatically derived from typeBati
        if (data.typeBati === Repartition.MIXTE && adresse.repartition) {
          const repartitionSelector = `select[name="adresses.${i}.repartition"]`;
          await this.page.selectOption(
            repartitionSelector,
            getRepartitionLabel(adresse.repartition)
          );
        }

        // Fill places autorisées
        await this.page.fill(
          `input[name="adresses.${i}.adresseTypologies.0.placesAutorisees"]`,
          adresse.placesAutorisees.toString()
        );
      }
    }
  }

  async submit(dnaCode: string) {
    await this.submitAndWaitForUrl(URLS.ajoutStep(dnaCode, "03-type-places"));
  }
}
