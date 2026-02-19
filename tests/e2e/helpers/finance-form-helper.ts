import { Page } from "@playwright/test";

import { safeExecute } from "./error-handler";
import { FormHelper } from "./form-helper";
import { FinanceYearData } from "./test-data/types";
import { WaitHelper } from "./wait-helper";

/**
 * Shared logic for filling finance/budget forms.
 * Used by both FinalisationFinancePage and ModificationFinancePage.
 */
export async function fillFinanceForm(
  page: Page,
  finances: Record<number, Partial<FinanceYearData>> | undefined
): Promise<void> {
  if (!finances) return;

  const waitHelper = new WaitHelper(page);
  const formHelper = new FormHelper(page);

  await waitHelper.waitForUIUpdate();
  const yearIndexMap = await getBudgetIndexByYear(page, finances);

  for (const [yearKey, fields] of Object.entries(finances)) {
    const year = Number(yearKey);
    const budgetIndex = yearIndexMap[year];
    if (budgetIndex === undefined) continue;

    for (const [field, value] of Object.entries(fields)) {
      if (value === undefined || value === null) continue;
      const selector = `input[name="budgets.${budgetIndex}.${field}"]`;
      const input = page.locator(selector);
      const count = await input.count();
      if (count === 0) continue;
      const isEnabled = await safeExecute(
        () => input.isEnabled(),
        false,
        `Failed to check if input is enabled: ${selector}`
      );
      if (isEnabled) {
        await formHelper.fillInput(selector, String(value));
      }
    }
  }
}

async function getBudgetIndexByYear(
  page: Page,
  finances: Record<number, Partial<FinanceYearData>>
): Promise<Record<number, number>> {
  const yearInputs = page.locator(
    'input[name^="budgets."][name$=".year"]'
  );
  const count = await yearInputs.count();
  const yearIndexMap: Record<number, number> = {};
  for (let i = 0; i < count; i++) {
    const value = await yearInputs.nth(i).inputValue();
    const year = Number(value);
    if (!Number.isNaN(year)) yearIndexMap[year] = i;
  }
  if (Object.keys(yearIndexMap).length > 0) return yearIndexMap;
  const sortedYears = Object.keys(finances)
    .map((y) => Number(y))
    .sort((a, b) => b - a);
  sortedYears.forEach((year, index) => {
    yearIndexMap[year] = index;
  });
  return yearIndexMap;
}
