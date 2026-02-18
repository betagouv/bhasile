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
    const of = data.ouvertureFermeture;
    if (of) {
      const placesACreer = this.page.getByLabel("Nombre de places à créer");
      if (of.placesACreer !== undefined && (await placesACreer.count()) > 0) {
        await placesACreer.first().fill(String(of.placesACreer));
      }
      const echeancePlacesACreer = this.page.getByLabel("Echéance").first();
      if (
        of.echeancePlacesACreer &&
        (await echeancePlacesACreer.count()) > 0
      ) {
        await echeancePlacesACreer.fill(of.echeancePlacesACreer);
      }
      const placesAFermer = this.page.getByLabel("Nombre de places à fermer");
      if (of.placesAFermer !== undefined && (await placesAFermer.count()) > 0) {
        await placesAFermer.first().fill(String(of.placesAFermer));
      }
      const echeancePlacesAFermer = this.page.getByLabel("Echéance").nth(1);
      if (
        of.echeancePlacesAFermer &&
        (await echeancePlacesAFermer.count()) > 0
      ) {
        await echeancePlacesAFermer.fill(of.echeancePlacesAFermer);
      }
    }

    const typologies = data.structureTypologies;
    if (typologies?.length) {
      for (let i = 0; i < typologies.length; i++) {
        const t = typologies[i];
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
  }
}
