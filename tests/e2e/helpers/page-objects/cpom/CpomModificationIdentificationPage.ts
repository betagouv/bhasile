import { expect, Page } from "@playwright/test";

import { TIMEOUTS } from "../../constants";
import { SELECTORS } from "../../selectors";
import { TestCpomAjoutData } from "../../test-data/cpom-types";
import { WaitHelper } from "../../wait-helper";
import { BasePage } from "../BasePage";

export class CpomModificationIdentificationPage extends BasePage {
  private waitHelper: WaitHelper;

  constructor(page: Page) {
    super(page);
    this.waitHelper = new WaitHelper(page);
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
      const dept =
        typeof data.departements === "string"
          ? data.departements
          : data.departements[0];
      const deptSelect = this.page.locator(SELECTORS.CPOM_DEPARTEMENTS_SELECT);
      const value = await deptSelect.inputValue().catch(() => "");
      if (value !== "") {
        await expect(deptSelect).toHaveValue(dept);
      }
    }

    const operateurInput = this.page.locator(SELECTORS.CPOM_OPERATEUR_INPUT);
    await expect(operateurInput).toHaveValue(data.operateur.name);

    const mainActe = data.actesAdministratifs[0];
    if (mainActe) {
      const startInput = this.page.locator(SELECTORS.CPOM_ACTE_START_DATE(0));
      await expect(startInput).toHaveValue(mainActe.startDate ?? "");
      const endInput = this.page.locator(SELECTORS.CPOM_ACTE_END_DATE(0));
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
}
