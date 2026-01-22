import { URLS } from "../../constants";
import { TestStructureData } from "../../test-data/types";
import { BasePage } from "../BasePage";

export class IdentificationPage extends BasePage {
  async fillForm(data: TestStructureData) {
    // Filiale (if provided)
    if (data.filiale) {
      // ToggleSwitch for filiale - check if it's already checked, if not, click it
      const filialeToggle = this.page.locator("#managed-by-a-filiale");
      const isChecked = await filialeToggle.isChecked().catch(() => false);
      if (!isChecked) {
        await filialeToggle.click();
      }
      // Wait for the filiale input to appear
      await this.page.waitForSelector("#filiale", {
        state: "visible",
        timeout: 5000,
      });
      await this.page.fill("#filiale", data.filiale);
    }

    // Date de création
    await this.page.fill('input[name="creationDate"]', data.creationDate);

    // Code FINESS (if required for autorisée structures)
    if (data.finessCode) {
      await this.page.fill('input[name="finessCode"]', data.finessCode);
    }

    // Public ciblé
    await this.page.selectOption("#public", data.public);

    // Checkboxes labellisées
    if (data.lgbt) {
      await this.page.click('input[name="lgbt"] + label');
    }
    if (data.fvvTeh) {
      await this.page.click('input[name="fvvTeh"] + label');
    }

    // Contact Principal
    await this.page.fill(
      'input[name="contactPrincipal.prenom"]',
      data.contactPrincipal.prenom
    );
    await this.page.fill(
      'input[name="contactPrincipal.nom"]',
      data.contactPrincipal.nom
    );
    await this.page.fill(
      'input[name="contactPrincipal.role"]',
      data.contactPrincipal.role
    );
    await this.page.fill(
      'input[name="contactPrincipal.email"]',
      data.contactPrincipal.email
    );
    await this.page.fill(
      'input[name="contactPrincipal.telephone"]',
      data.contactPrincipal.telephone
    );

    // Contact Secondaire (if provided)
    if (data.contactSecondaire) {
      await this.page.fill(
        'input[name="contactSecondaire.prenom"]',
        data.contactSecondaire.prenom
      );
      await this.page.fill(
        'input[name="contactSecondaire.nom"]',
        data.contactSecondaire.nom
      );
      await this.page.fill(
        'input[name="contactSecondaire.role"]',
        data.contactSecondaire.role
      );
      await this.page.fill(
        'input[name="contactSecondaire.email"]',
        data.contactSecondaire.email
      );
      await this.page.fill(
        'input[name="contactSecondaire.telephone"]',
        data.contactSecondaire.telephone
      );
    }

    // Période d'autorisation (for autorisée structures)
    if (data.debutPeriodeAutorisation) {
      await this.page.fill(
        'input[name="debutPeriodeAutorisation"]',
        data.debutPeriodeAutorisation
      );
    }
    if (data.finPeriodeAutorisation) {
      await this.page.fill(
        'input[name="finPeriodeAutorisation"]',
        data.finPeriodeAutorisation
      );
    }

    // Convention (for subventionnée structures)
    if (data.debutConvention) {
      await this.page.fill(
        'input[name="debutConvention"]',
        data.debutConvention
      );
    }
    if (data.finConvention) {
      await this.page.fill('input[name="finConvention"]', data.finConvention);
    }
  }

  async submit(dnaCode: string) {
    await this.submitAndWaitForUrl(URLS.ajoutStep(dnaCode, "02-adresses"));
  }
}
