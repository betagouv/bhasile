import { expect, Page } from "@playwright/test";

import { CURRENT_YEAR, START_YEAR } from "@/constants";

import { TIMEOUTS, URLS } from "../../constants";
import { safeExecute } from "../../error-handler";
import { FormHelper } from "../../form-helper";
import { TestCpomFinanceData } from "../../test-data/cpom-types";
import { WaitHelper } from "../../wait-helper";
import { BasePage } from "../BasePage";

const getMillesimeIndexForYear = (year: number): number => {
  return CURRENT_YEAR - year;
};

const CPOM_FINANCE_LINE_NAMES = [
  "dotationDemandee",
  "dotationAccordee",
  "cumulResultatNet",
  "repriseEtat",
  "affectationReservesFondsDedies",
  "reserveInvestissement",
  "chargesNonReconductibles",
  "reserveCompensationDeficits",
  "reserveCompensationBFR",
  "reserveCompensationAmortissements",
  "fondsDedies",
  "reportANouveau",
  "autre",
] as const;

export class CpomModificationFinancePage extends BasePage {
  private waitHelper: WaitHelper;
  private formHelper: FormHelper;

  constructor(page: Page) {
    super(page);
    this.waitHelper = new WaitHelper(page);
    this.formHelper = new FormHelper(page);
  }

  async fillForm(financeData: TestCpomFinanceData): Promise<void> {
    await this.waitForLoad();

    await this.waitHelper.waitForUIUpdate();
    const yearIndexMap = this.getCpomMillesimeIndexByYear(financeData);

    for (const [yearKey, fields] of Object.entries(financeData)) {
      const year = Number(yearKey);
      const millesimeIndex = yearIndexMap[year];
      if (millesimeIndex === undefined) {
        continue;
      }

      for (const field of CPOM_FINANCE_LINE_NAMES) {
        const value = (fields as Record<string, unknown>)[field];
        if (value === undefined || value === null) {
          continue;
        }
        const selector = `input[name="cpomMillesimes.${millesimeIndex}.${field}"]`;
        const input = this.page.locator(selector);
        const count = await input.count();
        if (count === 0) {
          continue;
        }
        const isEnabled = await safeExecute(
          () => input.first().isEnabled(),
          false,
          `Failed to check if input is enabled: ${selector}`
        );
        if (isEnabled) {
          await this.formHelper.fillInput(selector, String(value));
        }
      }
      if (fields.commentaire) {
        const commentSelector = `input[name="cpomMillesimes.${millesimeIndex}.commentaire"], textarea[name="cpomMillesimes.${millesimeIndex}.commentaire"]`;
        const commentInput = this.page.locator(commentSelector);
        if ((await commentInput.count()) > 0) {
          const isEnabled = await safeExecute(
            () => commentInput.first().isEnabled(),
            false,
            `Failed to check if comment input is enabled: ${commentSelector}`
          );
          if (isEnabled) {
            await this.formHelper.fillInput(
              commentSelector,
              fields.commentaire
            );
          }
        }
      }
    }

    await this.waitHelper.waitForUIUpdate(1);
  }

  private getCpomMillesimeIndexByYear(
    financeData: TestCpomFinanceData
  ): Record<number, number> {
    const yearIndexMap: Record<number, number> = {};
    const sortedYears = Object.keys(financeData)
      .map((year) => Number(year))
      .filter((year) => year >= START_YEAR && year <= CURRENT_YEAR)
      .sort((a, b) => a - b);
    for (const year of sortedYears) {
      yearIndexMap[year] = getMillesimeIndexForYear(year);
    }
    return yearIndexMap;
  }

  async verifyFinanceTable(financeData: TestCpomFinanceData): Promise<void> {
    await this.waitForLoad();

    await this.page
      .locator('input[name^="cpomMillesimes."][name$=".dotationDemandee"]')
      .first()
      .waitFor({ state: "visible", timeout: TIMEOUTS.NAVIGATION });

    for (const [yearStr, values] of Object.entries(financeData)) {
      const year = parseInt(yearStr, 10);
      if (year < START_YEAR || year > CURRENT_YEAR) {
        continue;
      }
      const index = getMillesimeIndexForYear(year);
      for (const lineName of CPOM_FINANCE_LINE_NAMES) {
        const expected = values[lineName as keyof typeof values];
        if (expected === undefined || expected === null) {continue;}
        const inputName = `cpomMillesimes.${index}.${lineName}`;
        const input = this.page.locator(`input[name="${inputName}"]`).first();
        if ((await input.count()) === 0) {continue;}
        if (!(await input.isEnabled().catch(() => false))) {continue;}
        const actual = await input.inputValue();
        const actualNormalized = actual.replace(/\s/g, "").replace(",", ".");
        const expectedStr = String(expected)
          .replace(/\s/g, "")
          .replace(",", ".");
        expect(
          actualNormalized,
          `cpomMillesimes.${index}.${lineName} (year ${year})`
        ).toBe(expectedStr.replace(/\s/g, "").replace(",", "."));
      }
      if (values.commentaire) {
        const commentName = `cpomMillesimes.${index}.commentaire`;
        const commentInput = this.page
          .locator(
            `input[name="${commentName}"], textarea[name="${commentName}"]`
          )
          .first();
        if ((await commentInput.count()) > 0) {
          const actual = await commentInput.inputValue();
          expect(actual).toBe(values.commentaire);
        }
      }
    }
  }

  async submit(): Promise<void> {
    await this.page.click('button[type="submit"]');
  }

  async submitAndConfirmRedirectToStructures(): Promise<void> {
    await this.submit();
    const modal = this.page.locator("#confirmation-cpom-modal");
    await expect(modal).toBeVisible({ timeout: TIMEOUTS.SUBMIT });
    await expect(
      modal.getByRole("heading", {
        name: /Vous avez créé un CPOM|Vous avez modifié un CPOM/i,
      })
    ).toBeVisible();
    const closeButton = modal.getByRole("button", { name: /compris/i });
    await closeButton.click();
    await this.page.waitForURL(URLS.STRUCTURES, {
      timeout: TIMEOUTS.NAVIGATION,
    });
  }
}
