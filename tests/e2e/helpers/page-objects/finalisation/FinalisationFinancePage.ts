import { Page } from "@playwright/test";

import { FinanceYearData, TestStructureData } from "../../test-data";

export class FinalisationFinancePage {
  constructor(private page: Page) {}

  async waitForLoad() {
    await this.page.waitForSelector('button[type="submit"]', {
      timeout: 10000,
    });
  }

  async fillMinimalData(data: TestStructureData) {
    const finances = data.finances;
    if (!finances) {
      return;
    }

    await this.page.waitForTimeout(1000);
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
        if ((await input.count()) === 0) {
          continue;
        }
        if (await input.isEnabled()) {
          await input.fill(String(value));
        }
      }
    }
  }

  async submit(structureId: number) {
    const nextUrl = `http://localhost:3000/structures/${structureId}/finalisation/04-controles`;
    await this.page.click('button[type="submit"]');
    await this.page.waitForURL(nextUrl, { timeout: 10000 });
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
