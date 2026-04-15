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
  if (!finances) {
    return;
  }

  const waitHelper = new WaitHelper(page);
  const formHelper = new FormHelper(page);
  const indicateurFields = new Set<keyof FinanceYearData>([
    "ETP",
    "tauxEncadrement",
    "coutJournalier",
  ]);

  await waitHelper.waitForUIUpdate();
  const yearIndexMap = await getBudgetIndexByYear(page, finances);
  const sortedYears = Object.keys(finances)
    .map((year) => Number(year))
    .sort((a, b) => a - b);
  const indicateurCutoffYear = 2024;

  for (const indicateurField of indicateurFields) {
    const inputSelector = `input[name^="indicateursFinanciers."][name$=".${indicateurField}"]`;
    const inputs = page.locator(inputSelector);
    const count = await inputs.count();
    if (count === 0) {
      continue;
    }
    const valuesToFill = sortedYears.flatMap((year) => {
      const value = finances[year]?.[indicateurField];
      if (value === undefined || value === null) {
        return [];
      }
      if (year >= indicateurCutoffYear) {
        return [String(value), String(value)];
      }
      return [String(value)];
    });
    for (let i = 0; i < Math.min(count, valuesToFill.length); i++) {
      const inputName = await inputs.nth(i).getAttribute("name");
      if (!inputName) {
        continue;
      }
      await formHelper.fillInput(`input[name="${inputName}"]`, valuesToFill[i]);
    }
  }

  for (const [yearKey, fields] of Object.entries(finances)) {
    const year = Number(yearKey);
    const budgetIndex = yearIndexMap[year];

    for (const [field, value] of Object.entries(fields)) {
      if (value === undefined || value === null) {
        continue;
      }
      if (indicateurFields.has(field as keyof FinanceYearData)) {
        continue;
      }
      if (budgetIndex === undefined) {
        continue;
      }

      const selector = `input[name="budgets.${budgetIndex}.${field}"]`;
      const input = page.locator(selector);
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
        await formHelper.fillInput(selector, String(value));
      }
    }
  }
}

async function getBudgetIndexByYear(
  page: Page,
  finances: Record<number, Partial<FinanceYearData>>
): Promise<Record<number, number>> {
  const yearInputs = page.locator('input[name^="budgets."][name$=".year"]');
  const count = await yearInputs.count();
  const yearIndexMap: Record<number, number> = {};
  for (let i = 0; i < count; i++) {
    const nameAttr = await yearInputs.nth(i).getAttribute("name");
    const match = nameAttr?.match(/^budgets\.(\d+)\.year$/);
    if (!match) {
      continue;
    }
    const budgetIndex = Number(match[1]);
    const value = await yearInputs.nth(i).inputValue();
    const year = Number(value);
    if (!Number.isNaN(year)) {
      yearIndexMap[year] = budgetIndex;
    }
  }
  if (Object.keys(yearIndexMap).length > 0) {
    return yearIndexMap;
  }
  const sortedYears = Object.keys(finances)
    .map((y) => Number(y))
    .sort((a, b) => b - a);
  sortedYears.forEach((year, index) => {
    yearIndexMap[year] = index;
  });
  return yearIndexMap;
}
