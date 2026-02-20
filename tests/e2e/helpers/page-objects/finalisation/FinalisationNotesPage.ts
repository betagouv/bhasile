import { Page } from "@playwright/test";

import { URLS } from "../../constants";
import { FormHelper } from "../../form-helper";
import { fillNotesForm } from "../../notes-form-helper";
import { TestStructureData } from "../../test-data/types";
import { WaitHelper } from "../../wait-helper";
import { BasePage } from "../BasePage";

export class FinalisationNotesPage extends BasePage {
  private formHelper: FormHelper;

  constructor(page: Page) {
    super(page);
    this.formHelper = new FormHelper(page);
  }

  async fillForm(data: TestStructureData) {
    await fillNotesForm(this.formHelper, data.finalisationNotes);
    const waitHelper = new WaitHelper(this.page);
    await waitHelper.waitForAutosave();
  }

  async submit(structureId: number, expectValidationFailure = false) {
    if (expectValidationFailure) {
      await this.submitAndExpectNoNavigation();
    } else {
      await this.submitAndWaitForUrl(
        URLS.finalisationStep(structureId, "06-notes")
      );
    }
  }

  async finalizeAndGoToStructure(structureId: number) {
    await this.page
      .getByRole("button", { name: "Finaliser la création" })
      .click();
    const confirmButton = this.page.getByRole("button", {
      name: /J.?ai compris/i,
    });
    await confirmButton.click();
    await this.page.waitForURL(URLS.structure(structureId));
  }
}
