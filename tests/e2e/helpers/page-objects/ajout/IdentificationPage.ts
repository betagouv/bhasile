import { expect, Page } from "@playwright/test";

import { TestStructureData } from "../../test-data";

export class IdentificationPage {
  constructor(private page: Page) {}

  async fillForm(data: TestStructureData) {
    const { identification } = data;

    // Filiale (if provided)
    if (identification.filiale) {
      const filialeToggle = this.page.getByRole("checkbox", {
        name: /filiale d’opérateur/i,
      });
      if (await filialeToggle.count()) {
        await filialeToggle.check();
        await expect(this.page.locator("#filiale")).toBeVisible();
        await this.page.fill("#filiale", identification.filiale);
      }
    }

    // Date de création
    await this.page.fill(
      'input[name="creationDate"]',
      identification.creationDate
    );

    // Code FINESS (if required for autorisée structures)
    if (identification.finessCode) {
      await this.page.fill(
        'input[name="finessCode"]',
        identification.finessCode
      );
    }

    // Public ciblé
    await this.page.selectOption("#public", identification.public);

    // Checkboxes labellisées
    if (identification.lgbt) {
      await this.page.click('input[name="lgbt"] + label');
    }
    if (identification.fvvTeh) {
      await this.page.click('input[name="fvvTeh"] + label');
    }

    // CPOM toggle switch and dates
    if (data.cpom) {
      // Click the CPOM toggle switch
      await this.page.click('input[title="CPOM"]');

      // Wait for CPOM date fields to appear
      await this.page.waitForTimeout(300);

      if (identification.debutCpom) {
        await this.page.fill(
          'input[name="debutCpom"]',
          identification.debutCpom
        );
      }
      if (identification.finCpom) {
        await this.page.fill('input[name="finCpom"]', identification.finCpom);
      }
    }

    // Contact Principal
    await this.page.fill(
      'input[name="contactPrincipal.prenom"]',
      identification.contactPrincipal.prenom
    );
    await this.page.fill(
      'input[name="contactPrincipal.nom"]',
      identification.contactPrincipal.nom
    );
    await this.page.fill(
      'input[name="contactPrincipal.role"]',
      identification.contactPrincipal.role
    );
    await this.page.fill(
      'input[name="contactPrincipal.email"]',
      identification.contactPrincipal.email
    );
    await this.page.fill(
      'input[name="contactPrincipal.telephone"]',
      identification.contactPrincipal.telephone
    );

    // Contact Secondaire (if provided)
    if (identification.contactSecondaire) {
      await this.page.fill(
        'input[name="contactSecondaire.prenom"]',
        identification.contactSecondaire.prenom
      );
      await this.page.fill(
        'input[name="contactSecondaire.nom"]',
        identification.contactSecondaire.nom
      );
      await this.page.fill(
        'input[name="contactSecondaire.role"]',
        identification.contactSecondaire.role
      );
      await this.page.fill(
        'input[name="contactSecondaire.email"]',
        identification.contactSecondaire.email
      );
      await this.page.fill(
        'input[name="contactSecondaire.telephone"]',
        identification.contactSecondaire.telephone
      );
    }

    // Période d'autorisation (for autorisée structures)
    if (identification.debutPeriodeAutorisation) {
      await this.page.fill(
        'input[name="debutPeriodeAutorisation"]',
        identification.debutPeriodeAutorisation
      );
    }
    if (identification.finPeriodeAutorisation) {
      await this.page.fill(
        'input[name="finPeriodeAutorisation"]',
        identification.finPeriodeAutorisation
      );
    }

    // Convention (for subventionnée structures)
    if (identification.debutConvention) {
      await this.page.fill(
        'input[name="debutConvention"]',
        identification.debutConvention
      );
    }
    if (identification.finConvention) {
      await this.page.fill(
        'input[name="finConvention"]',
        identification.finConvention
      );
    }
  }

  async submit(dnaCode: string) {
    await this.page.click('button[type="submit"]');
    await this.page.waitForURL(
      `http://localhost:3000/ajout-structure/${dnaCode}/02-adresses`
    );
  }
}
