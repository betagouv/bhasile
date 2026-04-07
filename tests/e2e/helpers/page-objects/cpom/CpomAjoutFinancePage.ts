import { expect, Page } from "@playwright/test";

import { CURRENT_YEAR, START_YEAR } from "@/constants";
import { StructureType } from "@/types/structure.type";

import { TIMEOUTS, URLS } from "../../constants";
import { safeExecute } from "../../error-handler";
import { FormHelper } from "../../form-helper";
import {
  TestCpomFinanceData,
  TestCpomFinanceLineData,
} from "../../test-data/cpom-types";
import { WaitHelper } from "../../wait-helper";
import { BasePage } from "../BasePage";

const getMillesimeIndexForYear = (year: number): number => {
  return CURRENT_YEAR - year;
};

const getYearSpan = (): number => CURRENT_YEAR - START_YEAR + 1;

const CPOM_FINANCE_LINE_NAMES = [
  "dotationDemandee",
  "dotationAccordee",
  "totalProduitsProposes",
  "totalProduits",
  "totalChargesProposees",
  "totalCharges",
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
  "excedentRecupere",
  "excedentDeduit",
] as const;

const STRUCTURE_TYPES: StructureType[] = [
  StructureType.CADA,
  StructureType.HUDA,
  StructureType.CPH,
  StructureType.CAES,
  StructureType.PRAHDA,
];

export class CpomAjoutFinancePage extends BasePage {
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
    const typePositions = await this.getTypePositionsFromForm(financeData);
    const yearSpan = getYearSpan();

    for (const [typeKey, yearlyData] of Object.entries(financeData)) {
      const type = typeKey as StructureType;
      const typePosition = typePositions[type];
      if (typePosition === undefined) {
        continue;
      }
      for (const [yearKey, fields] of Object.entries(yearlyData)) {
        const year = Number(yearKey);
        if (year < START_YEAR || year > CURRENT_YEAR) {
          continue;
        }
        const millesimeIndex = getMillesimeIndexForYear(year) + typePosition * yearSpan;

        for (const field of CPOM_FINANCE_LINE_NAMES) {
          const value = (fields as TestCpomFinanceLineData)[field];
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
          if ((await commentInput.count()) === 0) {
            continue;
          }
          const isEnabled = await safeExecute(
            () => commentInput.first().isEnabled(),
            false,
            `Failed to check if comment input is enabled: ${commentSelector}`
          );
          if (isEnabled) {
            await this.formHelper.fillInput(commentSelector, fields.commentaire);
          }
        }
      }
    }

    await this.waitHelper.waitForUIUpdate(1);
  }

  private async getTypePositionsFromForm(
    financeData: TestCpomFinanceData
  ): Promise<Partial<Record<StructureType, number>>> {
    const requestedTypes = Object.keys(financeData) as StructureType[];
    if (requestedTypes.length === 1) {
      return { [requestedTypes[0]]: 0 };
    }
    const headings = await this.page.locator("h2").allTextContents();
    const visibleTypes = headings
      .map((text) => text.trim())
      .filter((text): text is StructureType =>
        STRUCTURE_TYPES.includes(text as StructureType)
      );
    const positions: Partial<Record<StructureType, number>> = {};
    visibleTypes.forEach((type, index) => {
      positions[type] = index;
    });
    return positions;
  }

  async verifyFinanceTable(financeData: TestCpomFinanceData): Promise<void> {
    await this.waitForLoad();

    await this.page
      .locator('input[name^="cpomMillesimes."][name$=".dotationDemandee"]')
      .first()
      .waitFor({ state: "visible", timeout: TIMEOUTS.NAVIGATION });

    const typePositions = await this.getTypePositionsFromForm(financeData);
    const yearSpan = getYearSpan();

    for (const [typeKey, yearlyData] of Object.entries(financeData)) {
      const type = typeKey as StructureType;
      const typePosition = typePositions[type];
      if (typePosition === undefined) {
        continue;
      }
      for (const [yearStr, values] of Object.entries(yearlyData)) {
        const year = parseInt(yearStr, 10);
        if (year < START_YEAR || year > CURRENT_YEAR) {
          continue;
        }
        const index = getMillesimeIndexForYear(year) + typePosition * yearSpan;
        for (const lineName of CPOM_FINANCE_LINE_NAMES) {
          const expected = values[lineName as keyof typeof values];
          if (expected === undefined || expected === null) {
            continue;
          }
          const inputName = `cpomMillesimes.${index}.${lineName}`;
          const input = this.page.locator(`input[name="${inputName}"]`).first();
          if ((await input.count()) === 0) {
            continue;
          }
          if (!(await input.isEnabled().catch(() => false))) {
            continue;
          }
          const actual = await input.inputValue();
          const actualNormalized = actual.replace(/\s/g, "").replace(",", ".");
          const expectedStr = String(expected)
            .replace(/\s/g, "")
            .replace(",", ".");
          expect(actualNormalized, `${inputName} (year ${year})`).toBe(
            expectedStr.replace(/\s/g, "").replace(",", ".")
          );
        }
        if (values.commentaire) {
          const commentName = `cpomMillesimes.${index}.commentaire`;
          const commentInput = this.page
            .locator(
              `input[name="${commentName}"], textarea[name="${commentName}"]`
            )
            .first();
          if ((await commentInput.count()) === 0) {
            continue;
          }
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
