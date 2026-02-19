import { Page } from "@playwright/test";

import { URLS } from "../../constants";
import { FormHelper } from "../../form-helper";
import { ModificationData } from "../../test-data/types";
import { BasePage } from "../BasePage";

export class ModificationCalendrierPage extends BasePage {
  private formHelper: FormHelper;

  constructor(page: Page) {
    super(page);
    this.formHelper = new FormHelper(page);
  }

  override async waitForLoad() {
    await this.waitForHeading(/Modification/i);
    await super.waitForLoad();
  }

  async fillForm(data: ModificationData) {
    if (data.debutPeriodeAutorisation) {
      await this.formHelper.fillInputIfExists(
        'input[name="debutPeriodeAutorisation"]',
        data.debutPeriodeAutorisation
      );
    }
    if (data.finPeriodeAutorisation) {
      await this.formHelper.fillInputIfExists(
        'input[name="finPeriodeAutorisation"]',
        data.finPeriodeAutorisation
      );
    }
    if (data.debutConvention) {
      await this.formHelper.fillInputIfExists(
        'input[name="debutConvention"]',
        data.debutConvention
      );
    }
    if (data.finConvention) {
      await this.formHelper.fillInputIfExists(
        'input[name="finConvention"]',
        data.finConvention
      );
    }
  }

  async submit(structureId: number) {
    await this.submitAndWaitForUrl(URLS.structure(structureId));
    console.log("submit calendrier");
    await this.page.waitForTimeout(60000);
  }
}
