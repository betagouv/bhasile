import { expect, Locator, Page } from "@playwright/test";

import { TIMEOUTS, URLS } from "../../constants";
import { TestCpomFinanceData } from "../../test-data/cpom-types";
import { WaitHelper } from "../../wait-helper";
import { BasePage } from "../BasePage";

const CPOM_FINANCE_YEAR_START = 2021;
const CPOM_FINANCE_YEAR_END = 2025; // CURRENT_YEAR in app constants

/** Index of year in cpomMillesimes array (getYearRange asc: 2021..2025) */
function getMillesimeIndexForYear(year: number): number {
  return year - CPOM_FINANCE_YEAR_START;
}

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

  constructor(page: Page) {
    super(page);
    this.waitHelper = new WaitHelper(page);
  }

  async waitForLoad(): Promise<void> {
    await super.waitForLoad();
    await this.waitForHeading(/Analyse financière/i);
  }

  /**
   * Fill a single numeric input. Uses click + clear + type so React/NumericFormat
   * controlled components receive change events and update form state.
   */
  private async fillNumericInput(
    locator: Locator,
    value: number | string
  ): Promise<void> {
    const el = locator.first();
    await el.waitFor({ state: "visible", timeout: 5000 }).catch(() => {});
    if (!(await el.isEnabled().catch(() => false))) return;
    await el.click();
    await el.press("Control+a");
    await el.press("Backspace");
    await el.pressSequentially(String(value), { delay: 30 });
  }

  async fillFinanceTable(financeData: TestCpomFinanceData): Promise<void> {
    await this.waitForLoad();

    // Wait for the finance table to be visible (inputs may be disabled for years outside CPOM range)
    await this.page
      .locator('input[name^="cpomMillesimes."][name$=".dotationDemandee"]')
      .first()
      .waitFor({ state: "visible", timeout: TIMEOUTS.NAVIGATION });

    for (const [yearStr, values] of Object.entries(financeData)) {
      const year = parseInt(yearStr, 10);
      if (year < CPOM_FINANCE_YEAR_START || year > CPOM_FINANCE_YEAR_END) {
        continue;
      }
      const index = getMillesimeIndexForYear(year);
      for (const lineName of CPOM_FINANCE_LINE_NAMES) {
        const value = values[lineName as keyof typeof values];
        if (value === undefined || value === null) continue;
        const inputName = `cpomMillesimes.${index}.${lineName}`;
        const input = this.page.locator(`input[name="${inputName}"]`);
        if ((await input.count()) > 0) {
          await this.fillNumericInput(input, value);
        }
      }
      if (values.commentaire) {
        const commentName = `cpomMillesimes.${index}.commentaire`;
        const commentInput = this.page.locator(
          `input[name="${commentName}"], textarea[name="${commentName}"]`
        );
        if ((await commentInput.count()) > 0) {
          await commentInput.first().click();
          await commentInput.first().fill(values.commentaire);
        }
      }
    }

    await this.waitHelper.waitForUIUpdate(1);
  }

  /**
   * Verify that the finance table displays the expected saved data.
   * Compares input values with the provided financeData (numeric values may be shown as strings).
   */
  async verifyFinanceTable(financeData: TestCpomFinanceData): Promise<void> {
    await this.waitForLoad();

    await this.page
      .locator('input[name^="cpomMillesimes."][name$=".dotationDemandee"]')
      .first()
      .waitFor({ state: "visible", timeout: TIMEOUTS.NAVIGATION });

    for (const [yearStr, values] of Object.entries(financeData)) {
      const year = parseInt(yearStr, 10);
      if (year < CPOM_FINANCE_YEAR_START || year > CPOM_FINANCE_YEAR_END) {
        continue;
      }
      const index = getMillesimeIndexForYear(year);
      for (const lineName of CPOM_FINANCE_LINE_NAMES) {
        const expected = values[lineName as keyof typeof values];
        if (expected === undefined || expected === null) continue;
        const inputName = `cpomMillesimes.${index}.${lineName}`;
        const input = this.page.locator(`input[name="${inputName}"]`).first();
        if ((await input.count()) === 0) continue;
        if (!(await input.isEnabled().catch(() => false))) continue;
        const actual = await input.inputValue();
        // NumericFormat uses thousandSeparator=" " so value may be "100 000"
        const actualNormalized = actual.replace(/\s/g, "").replace(",", ".");
        const expectedStr = String(expected);
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

  /**
   * Submit the finance form, wait for the confirmation modal, click "J'ai compris"
   * and assert redirect to /structures.
   */
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
