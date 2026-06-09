import { Page } from "@playwright/test";

import { AutocompleteHelper } from "../../autocomplete-helper";
import { CheckboxHelper } from "../../checkbox-helper";
import { TIMEOUTS } from "../../constants";
import { FormHelper } from "../../form-helper";
import { SELECTORS } from "../../selectors";
import { TestCpomAjoutData } from "../../test-data/cpom-types";
import { WaitHelper } from "../../wait-helper";
import { BasePage } from "../BasePage";
import { CpomIdentificationFormHelper } from "./CpomIdentificationFormHelper";

export class CpomAjoutIdentificationPage extends BasePage {
  private formHelper: FormHelper;
  private waitHelper: WaitHelper;
  private cpomFormHelper: CpomIdentificationFormHelper;

  constructor(page: Page) {
    super(page);
    this.formHelper = new FormHelper(page);
    this.waitHelper = new WaitHelper(page);
    const autocompleteHelper = new AutocompleteHelper(page);
    const checkboxHelper = new CheckboxHelper(page);
    this.cpomFormHelper = new CpomIdentificationFormHelper(
      page,
      this.formHelper,
      this.waitHelper,
      autocompleteHelper,
      checkboxHelper
    );
  }

  async fillForm(data: TestCpomAjoutData): Promise<void> {
    await this.cpomFormHelper.fillGeneralFields(data);
    await this.waitHelper.waitForUIUpdate(2);
    await this.cpomFormHelper.fillActesFields(data, { uploadFiles: true });
    await this.waitHelper.waitForUIUpdate(2);
    await this.cpomFormHelper.fillCompositionFields(data, {
      waitForCompositionLegend: true,
    });
  }

  async submit(expectValidationFailure = false): Promise<number | null> {
    if (expectValidationFailure) {
      await this.submitAndExpectNoNavigation();
      return null;
    }
    await this.page.click(SELECTORS.SUBMIT_BUTTON);
    await this.page.waitForURL(/\/cpoms\/\d+\/ajout\/02-finances/, {
      timeout: TIMEOUTS.SUBMIT,
    });
    const url = this.page.url();
    const match = url.match(/\/cpoms\/(\d+)\/ajout\/02-finances/);
    return match ? parseInt(match[1], 10) : null;
  }
}
