import { Page } from "@playwright/test";

import { TIMEOUTS, URLS } from "../../constants";
import {
  fillControlesForm,
  fillEvaluationsForm,
} from "../../controles-form-helper";
import { FormHelper } from "../../form-helper";
import { SELECTORS } from "../../selectors";
import { ModificationData } from "../../test-data/types";
import { BasePage } from "../BasePage";

export class ModificationControlePage extends BasePage {
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
    await fillEvaluationsForm(
      this.page,
      this.formHelper,
      data.evaluations ?? [],
      {}
    );
    await this.page
      .waitForLoadState("networkidle", { timeout: TIMEOUTS.FILE_UPLOAD })
      .catch(() => {});
    await fillControlesForm(
      this.page,
      this.formHelper,
      data.controles ?? [],
      {}
    );
  }

  async submit(structureId: number) {
    await this.page
      .waitForLoadState("networkidle", { timeout: TIMEOUTS.FILE_UPLOAD })
      .catch(() => {});
    const submitButton = this.page.locator(SELECTORS.SUBMIT_BUTTON);
    await submitButton.waitFor({
      state: "visible",
      timeout: TIMEOUTS.NAVIGATION,
    });
    await submitButton.click({ force: true });
    await this.page.waitForURL(URLS.structure(structureId), { timeout: 30000 });
  }
}
