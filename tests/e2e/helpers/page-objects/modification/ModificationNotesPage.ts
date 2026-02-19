import { Page } from "@playwright/test";

import { URLS } from "../../constants";
import { FormHelper } from "../../form-helper";
import { fillNotesForm } from "../../notes-form-helper";
import { ModificationData } from "../../test-data/types";
import { BasePage } from "../BasePage";

export class ModificationNotesPage extends BasePage {
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
    if (data.notes) {
      await fillNotesForm(this.page, this.formHelper, data.notes);
    }
  }

  async submit(structureId: number) {
    await this.submitAndWaitForUrl(URLS.structure(structureId));
    console.log("submit notes");
    await this.page.waitForTimeout(10000);
  }
}
