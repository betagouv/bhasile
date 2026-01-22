import { Page } from "@playwright/test";

import { CheckboxHelper } from "../../checkbox-helper";
import { URLS } from "../../constants";
import { FormHelper } from "../../form-helper";
import { SELECTORS } from "../../selectors";
import { TestStructureData } from "../../test-data/types";
import { WaitHelper } from "../../wait-helper";
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
    if (data.filiale) {
      await this.formHelper.toggleSwitch(SELECTORS.FILIALE_TOGGLE, true);
      await this.waitHelper.waitForFormFieldReady(SELECTORS.FILIALE_INPUT);
      await this.formHelper.fillInput(SELECTORS.FILIALE_INPUT, data.filiale);
    }

    await this.formHelper.fillDate(
      'input[name="creationDate"]',
      data.creationDate
    );

    if (data.finessCode) {
      await this.formHelper.fillInput(
        'input[name="finessCode"]',
        data.finessCode
      );
    }

    await this.formHelper.selectOption(SELECTORS.PUBLIC_SELECT, data.public);

    if (data.lgbt) {
      await this.checkboxHelper.check('input[name="lgbt"]', { useLabel: true });
    }
    if (data.fvvTeh) {
      await this.checkboxHelper.check('input[name="fvvTeh"]', {
        useLabel: true,
      });
    }

    await this.formHelper.fillContact(
      "contactPrincipal",
      data.contactPrincipal
    );

    if (data.contactSecondaire) {
      await this.formHelper.fillContact(
        "contactSecondaire",
        data.contactSecondaire
      );
    }

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

  async submit(dnaCode: string, expectValidationFailure = false) {
    if (expectValidationFailure) {
      await this.submitAndExpectNoNavigation();
    } else {
      await this.submitAndWaitForUrl(URLS.ajoutStep(dnaCode, "02-adresses"));
    }
  }
}
