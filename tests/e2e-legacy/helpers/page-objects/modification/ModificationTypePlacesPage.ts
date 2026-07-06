import { Page } from "@playwright/test";

import { URLS } from "../../constants";
import { FormHelper } from "../../form-helper";
import { ModificationData } from "../../test-data/types";
import { BasePage } from "../BasePage";

export class ModificationTypePlacesPage extends BasePage {
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
    if (data.structureTypologies?.length) {
      for (let i = 0; i < data.structureTypologies.length; i++) {
        const structureTypology = data.structureTypologies[i];
        await this.formHelper.fillInputIfExists(
          `input[name="structureTypologies.${i}.placesAutorisees"]`,
          String(structureTypology.placesAutorisees)
        );
        await this.formHelper.fillInputIfExists(
          `input[name="structureTypologies.${i}.pmr"]`,
          String(structureTypology.pmr)
        );
        await this.formHelper.fillInputIfExists(
          `input[name="structureTypologies.${i}.lgbt"]`,
          String(structureTypology.lgbt)
        );
        await this.formHelper.fillInputIfExists(
          `input[name="structureTypologies.${i}.fvvTeh"]`,
          String(structureTypology.fvvTeh)
        );
      }
    }
  }

  async submit(structureId: number) {
    await this.submitAndWaitForUrl(URLS.structure(structureId));
  }
}
