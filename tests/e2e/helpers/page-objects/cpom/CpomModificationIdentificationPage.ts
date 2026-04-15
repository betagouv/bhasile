import { expect, Page } from "@playwright/test";

import { AutocompleteHelper } from "../../autocomplete-helper";
import { CheckboxHelper } from "../../checkbox-helper";
import { TIMEOUTS } from "../../constants";
import { FormHelper } from "../../form-helper";
import { SELECTORS } from "../../selectors";
import { TestCpomAjoutData } from "../../test-data/cpom-types";
import { WaitHelper } from "../../wait-helper";
import { BasePage } from "../BasePage";
import { CpomIdentificationFormHelper } from "./CpomIdentificationFormHelper";

export class CpomModificationIdentificationPage extends BasePage {
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

  override async waitForLoad(): Promise<void> {
    await this.page
      .locator(SELECTORS.SUBMIT_BUTTON)
      .first()
      .waitFor({ state: "visible", timeout: TIMEOUTS.NAVIGATION });
  }

  async verifyForm(data: TestCpomAjoutData): Promise<void> {
    await this.waitForLoad();

    const granularityRadio = this.page.locator(
      SELECTORS.CPOM_GRANULARITY_RADIO(data.granularity)
    );
    await expect(granularityRadio).toBeChecked();

    const regionSelect = this.page.locator(SELECTORS.CPOM_REGION_SELECT);
    await expect(regionSelect).toHaveValue(data.region);

    if (data.granularity === "DEPARTEMENTALE") {
      const departements =
        typeof data.departements === "string"
          ? data.departements
          : data.departements[0];
      const departementsSelect = this.page.locator(
        SELECTORS.CPOM_DEPARTEMENTS_SELECT
      );
      const value = await departementsSelect.inputValue().catch(() => "");
      if (value !== "") {
        await expect(departementsSelect).toHaveValue(departements);
      }
    }

    const operateurInput = this.page.locator(SELECTORS.CPOM_OPERATEUR_INPUT);
    await expect(operateurInput).toHaveValue(data.operateur.name);

    const mainActe = data.actesAdministratifs[0];
    if (mainActe) {
      const startInput = this.page
        .locator('input[name^="actesAdministratifs."][name$=".startDate"]')
        .first();
      await startInput.waitFor({
        state: "visible",
        timeout: TIMEOUTS.NAVIGATION,
      });
      await expect(startInput).toHaveValue(mainActe.startDate ?? "");
      const endInput = this.page
        .locator('input[name^="actesAdministratifs."][name$=".endDate"]')
        .first();
      const possibleEndDates = [
        mainActe.endDate,
        data.actesAdministratifs[1]?.endDate,
        data.avenants?.[0]?.endDate,
      ].filter(Boolean) as string[];
      const actualEnd = await endInput.inputValue();
      expect(possibleEndDates).toContain(actualEnd);
    }

    if (data.structureIds === "all" || (data.structureIds?.length ?? 0) > 0) {
      const compositionLegend = this.page.locator(
        'legend:has-text("Composition")'
      );
      await compositionLegend
        .waitFor({ state: "visible", timeout: TIMEOUTS.NAVIGATION })
        .catch(() => {});
      await this.waitHelper.waitForUIUpdate(2);
    }
  }

  async fillDescriptionForm(data: TestCpomAjoutData): Promise<void> {
    await this.cpomFormHelper.fillGeneralFields(data, {
      skipOperatorIfAlreadyMatching: true,
    });
    await this.waitHelper.waitForUIUpdate(1);
  }

  async fillActesAdministratifsForm(data: TestCpomAjoutData): Promise<void> {
    await this.cpomFormHelper.fillActesFields(data, {
      uploadFiles: false,
      addAvenantOnlyIfMissing: true,
    });
    await this.waitHelper.waitForUIUpdate(1);
  }

  async fillCompositionForm(data: TestCpomAjoutData): Promise<void> {
    await this.cpomFormHelper.fillCompositionFields(data);
    await this.waitHelper.waitForUIUpdate(1);
  }

  async submit(): Promise<void> {
    const openDepartementsPanel = this.page.locator(
      'button[aria-expanded="true"]'
    );
    if ((await openDepartementsPanel.count()) > 0) {
      await openDepartementsPanel.first().click();
      await this.waitHelper.waitForUIUpdate(1);
    }
    await this.page.click(SELECTORS.SUBMIT_BUTTON, { force: true });
    await this.waitHelper.waitForUIUpdate(2);
  }
}
