import { Page } from "@playwright/test";

import { TIMEOUTS, URLS } from "../../constants";
import {
  fillControlesForm,
  fillEvaluationsForm,
  fillOuvertureFermetureForm,
} from "../../controles-form-helper";
import { FormHelper } from "../../form-helper";
import { SELECTORS } from "../../selectors";
import { TestStructureData } from "../../test-data/types";
import { WaitHelper } from "../../wait-helper";
import { BasePage } from "../BasePage";

export class FinalisationControlesPage extends BasePage {
  private formHelper: FormHelper;

  constructor(page: Page) {
    super(page);
    this.formHelper = new FormHelper(page);
  }

  async fillForm(data: TestStructureData) {
    await fillEvaluationsForm(
      this.page,
      this.formHelper,
      data.evaluations ?? []
    );
    await this.page
      .waitForLoadState("networkidle", { timeout: TIMEOUTS.FILE_UPLOAD })
      .catch(() => {});
    await fillControlesForm(this.page, this.formHelper, data.controles ?? []);
    await fillOuvertureFermetureForm(this.page, data.ouvertureFermeture);
    const waitHelper = new WaitHelper(this.page);
    await waitHelper.waitForAutosave();
  }

  async submit(structureId: number, expectValidationFailure = false) {
    if (expectValidationFailure) {
      await this.submitAndExpectNoNavigation();
    } else {
      await this.page
        .waitForLoadState("networkidle", {
          timeout: TIMEOUTS.FILE_UPLOAD,
        })
        .catch(() => {});
      const submitButton = this.page.locator(SELECTORS.SUBMIT_BUTTON);
      await submitButton.waitFor({
        state: "visible",
        timeout: TIMEOUTS.NAVIGATION,
      });
      await submitButton.click({ force: true });
      await this.page.waitForURL(
        URLS.finalisationStep(structureId, "05-documents"),
        { timeout: 30000 }
      );
    }
  }
}
