import { Page } from "@playwright/test";

import { CheckboxHelper } from "../../checkbox-helper";
import { FormHelper } from "../../form-helper";
import { WaitHelper } from "../../wait-helper";
import { URLS } from "../../constants";
import { TestStructureData } from "../../test-data/types";
import { BasePage } from "../BasePage";

export class IdentificationPage extends BasePage {
  private checkboxHelper: CheckboxHelper;
  private formHelper: FormHelper;
  private waitHelper: WaitHelper;

  constructor(page: Page) {
    super(page);
    this.checkboxHelper = new CheckboxHelper(page);
    this.formHelper = new FormHelper(page);
    this.waitHelper = new WaitHelper(page);
  }

  async fillForm(data: TestStructureData) {
    // Filiale (if provided)
    if (data.filiale) {
      // ToggleSwitch for filiale
      await this.formHelper.toggleSwitch("#managed-by-a-filiale", true);
      // Wait for the filiale input to appear
      await this.waitHelper.waitForFormFieldReady("#filiale");
      await this.formHelper.fillInput("#filiale", data.filiale);
    }

    // Date de création
    await this.formHelper.fillDate(
      'input[name="creationDate"]',
      data.creationDate
    );

    // Code FINESS (if required for autorisée structures)
    if (data.finessCode) {
      await this.formHelper.fillInput(
        'input[name="finessCode"]',
        data.finessCode
      );
    }

    // Public ciblé
    await this.formHelper.selectOption("#public", data.public);

    // Checkboxes labellisées
    if (data.lgbt) {
      await this.checkboxHelper.check('input[name="lgbt"]', { useLabel: true });
    }
    if (data.fvvTeh) {
      await this.checkboxHelper.check('input[name="fvvTeh"]', {
        useLabel: true,
      });
    }

    // Contact Principal
    await this.formHelper.fillContact(
      "contactPrincipal",
      data.contactPrincipal
    );

    // Contact Secondaire (if provided)
    if (data.contactSecondaire) {
      await this.formHelper.fillContact(
        "contactSecondaire",
        data.contactSecondaire
      );
    }

    // Période d'autorisation (for autorisée structures)
    if (data.debutPeriodeAutorisation) {
      await this.formHelper.fillDate(
        'input[name="debutPeriodeAutorisation"]',
        data.debutPeriodeAutorisation
      );
    }
    if (data.finPeriodeAutorisation) {
      await this.formHelper.fillDate(
        'input[name="finPeriodeAutorisation"]',
        data.finPeriodeAutorisation
      );
    }

    // Convention (for subventionnée structures)
    if (data.debutConvention) {
      await this.formHelper.fillDate(
        'input[name="debutConvention"]',
        data.debutConvention
      );
    }
    if (data.finConvention) {
      await this.formHelper.fillDate(
        'input[name="finConvention"]',
        data.finConvention
      );
    }
  }

  async submit(dnaCode: string) {
    await this.submitAndWaitForUrl(URLS.ajoutStep(dnaCode, "02-adresses"));
  }
}
