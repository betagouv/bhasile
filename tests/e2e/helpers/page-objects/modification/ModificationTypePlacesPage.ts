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
    if (data.ouvertureFermeture) {
      const placesACreer = this.page.getByLabel("Nombre de places à créer");
      if (
        data.ouvertureFermeture.placesACreer !== undefined &&
        (await placesACreer.count()) > 0
      ) {
        await placesACreer
          .first()
          .fill(String(data.ouvertureFermeture.placesACreer));
      }
      const echeancePlacesACreer = this.page.getByLabel("Echéance").first();
      if (
        data.ouvertureFermeture.echeancePlacesACreer &&
        (await echeancePlacesACreer.count()) > 0
      ) {
        await echeancePlacesACreer.fill(
          data.ouvertureFermeture.echeancePlacesACreer
        );
      }
      const placesAFermer = this.page.getByLabel("Nombre de places à fermer");
      if (
        data.ouvertureFermeture.placesAFermer !== undefined &&
        (await placesAFermer.count()) > 0
      ) {
        await placesAFermer
          .first()
          .fill(String(data.ouvertureFermeture.placesAFermer));
      }
      const echeancePlacesAFermer = this.page.getByLabel("Echéance").nth(1);
      if (
        data.ouvertureFermeture.echeancePlacesAFermer &&
        (await echeancePlacesAFermer.count()) > 0
      ) {
        await echeancePlacesAFermer.fill(
          data.ouvertureFermeture.echeancePlacesAFermer
        );
      }
    }

    if (data.structureTypologies?.length) {
      for (let i = 0; i < data.structureTypologies.length; i++) {
        const t = data.structureTypologies[i];
        await this.formHelper.fillInputIfExists(
          `input[name="structureTypologies.${i}.placesAutorisees"]`,
          String(t.placesAutorisees)
        );
        await this.formHelper.fillInputIfExists(
          `input[name="structureTypologies.${i}.pmr"]`,
          String(t.pmr)
        );
        await this.formHelper.fillInputIfExists(
          `input[name="structureTypologies.${i}.lgbt"]`,
          String(t.lgbt)
        );
        await this.formHelper.fillInputIfExists(
          `input[name="structureTypologies.${i}.fvvTeh"]`,
          String(t.fvvTeh)
        );
      }
    }
  }

  async submit(structureId: number) {
    await this.submitAndWaitForUrl(URLS.structure(structureId));
    console.log("submit type places");
    await this.page.waitForTimeout(10000);
  }
}
