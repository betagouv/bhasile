import { Page } from "@playwright/test";

import { URLS } from "../../constants";
import { safeExecute } from "../../error-handler";
import { FormHelper } from "../../form-helper";
import { FinanceYearData, TestStructureData } from "../../test-data/types";
import { WaitHelper } from "../../wait-helper";
import { BasePage } from "../BasePage";

export class FinalisationFinancePage extends BasePage {
  private waitHelper: WaitHelper;
  private formHelper: FormHelper;

  constructor(page: Page) {
    super(page);
    this.waitHelper = new WaitHelper(page);
    this.formHelper = new FormHelper(page);
  }

  async fillForm(data: TestStructureData) {
    const finances = data.finances;
    if (!finances) {
      return;
    }

    await this.waitHelper.waitForUIUpdate();
    const yearIndexMap = await this.getBudgetIndexByYear(finances);

    for (const [yearKey, fields] of Object.entries(finances)) {
      const year = Number(yearKey);
      const budgetIndex = yearIndexMap[year];
      if (budgetIndex === undefined) {
        continue;
      }

      for (const [field, value] of Object.entries(fields)) {
        if (value === undefined || value === null) {
          continue;
        }
        const selector = `input[name="budgets.${budgetIndex}.${field}"]`;
        const input = this.page.locator(selector);
        const count = await input.count();
        if (count === 0) {
          continue;
        }
        const isEnabled = await safeExecute(
          () => input.isEnabled(),
          false,
          `Failed to check if input is enabled: ${selector}`
        );
        if (isEnabled) {
          await this.formHelper.fillInput(selector, String(value));
        }
      }
    }
  }

  async submit(structureId: number) {
    await this.submitAndWaitForUrl(
      URLS.finalisationStep(structureId, "04-controles")
    );
  }

  private async getBudgetIndexByYear(
    finances: Record<number, FinanceYearData>
  ) {
    const yearInputs = this.page.locator(
      'input[name^="budgets."][name$=".year"]'
    );
    const count = await yearInputs.count();
    const yearIndexMap: Record<number, number> = {};
    for (let i = 0; i < count; i++) {
      const input = yearInputs.nth(i);
      const value = await input.inputValue();
      const year = Number(value);
      if (!Number.isNaN(year)) {
        yearIndexMap[year] = i;
      }
    }

    if (Object.keys(yearIndexMap).length > 0) {
      return yearIndexMap;
    }

    const sortedYears = Object.keys(finances)
      .map((year) => Number(year))
      .sort((a, b) => b - a);
    sortedYears.forEach((year, index) => {
      yearIndexMap[year] = index;
    });
    return yearIndexMap;
  }
}
