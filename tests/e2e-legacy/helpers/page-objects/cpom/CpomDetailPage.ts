import { expect, Page } from "@playwright/test";

import { getGranularityLabel } from "@/app/utils/cpom.util";
import { formatDate } from "@/app/utils/date.util";
import { formatCurrency } from "@/app/utils/number.util";
import { CURRENT_YEAR, START_YEAR } from "@/constants";
import { StructureType } from "@/types/structure.type";

import { TIMEOUTS } from "../../constants";
import {
  TestCpomAjoutData,
  TestCpomFinanceData,
} from "../../test-data/cpom-types";
import { BasePage } from "../BasePage";

export class CpomDetailPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  override async waitForLoad(): Promise<void> {
    await this.page
      .locator("#description")
      .waitFor({ state: "visible", timeout: TIMEOUTS.NAVIGATION });
  }

  async verifyDescription(formData: TestCpomAjoutData): Promise<void> {
    await this.waitForLoad();

    const descriptionSection = this.page.locator("#description");

    await expect(descriptionSection).toContainText(formData.operateur.name);
    await expect(descriptionSection).toContainText(
      getGranularityLabel(formData.granularity)
    );
    await expect(descriptionSection).toContainText(formData.region);

    if (formData.granularity !== "REGIONALE") {
      const departements =
        typeof formData.departements === "string"
          ? formData.departements
          : formData.departements?.join(", ");
      if (departements) {
        await expect(descriptionSection).toContainText(departements);
      }
    }

    const mainActe = formData.actesAdministratifs[0];
    const dateStart = mainActe?.startDate
      ? formatDate(mainActe.startDate)
      : null;
    const possibleDateEnds = [
      mainActe?.endDate,
      ...(formData.avenants?.map((a) => a.endDate).filter(Boolean) ?? []),
    ]
      .filter(Boolean)
      .map((date) => formatDate(date as string));

    if (dateStart) {
      await expect(descriptionSection).toContainText(dateStart);
    }
    if (possibleDateEnds.length > 0) {
      const descriptionText = (await descriptionSection.textContent()) ?? "";
      const matchesOneDate = possibleDateEnds.some((dateEndFormatted) =>
        descriptionText.includes(dateEndFormatted)
      );
      expect(matchesOneDate, "Description should contain a valid CPOM end date").toBe(true);
    }
  }

  async verifyFinances(
    financeData: TestCpomFinanceData,
    formData: TestCpomAjoutData
  ): Promise<void> {
    await this.waitForLoad();

    const financesBlock = this.page.locator("#finances");
    await expect(financesBlock).toBeVisible({ timeout: TIMEOUTS.NAVIGATION });

    const normalizeForCompare = (s: string) =>
      s
        .replace(/\s/g, "")
        .replace(/\u00a0/g, "")
        .replace(/\u202f/g, "");

    const { minYear, maxYear } = this.getCpomYearRange(formData);

    const switchInput = this.page.locator('input[name="FinanceTypeSwitch"]');
    const hasTypeSwitch = (await switchInput.count()) > 0;

    for (const [typeKey, yearlyData] of Object.entries(financeData)) {
      const type = typeKey as StructureType;
      if (hasTypeSwitch) {
        const typeInput = this.page.locator(
          `input[name="FinanceTypeSwitch"][value="${type}"]`
        );
        if ((await typeInput.count()) === 0) {
          continue;
        }
        await this.page.locator(`label[for="${type}"]`).first().click();
        await expect(typeInput).toBeChecked();
      }

      const currentBlockText = (await financesBlock.textContent()) ?? "";
      const normalizedCurrentBlockText = normalizeForCompare(currentBlockText);

      for (const [yearStr, values] of Object.entries(yearlyData)) {
        const year = parseInt(yearStr, 10);
        if (year < START_YEAR || year > CURRENT_YEAR) {
          continue;
        }
        if (year < minYear || year > maxYear) {
          continue;
        }

        for (const [key, value] of Object.entries(values)) {
          if (value === undefined || value === null) {
            continue;
          }

          if (key === "commentaire") {
            if (String(value).length > 0) {
              expect(
                normalizedCurrentBlockText,
                `Finances should contain commentaire "${value}" (${type} ${year})`
              ).toContain(normalizeForCompare(String(value)));
            }
            continue;
          }

          const expectedText = formatCurrency(value as number | string);
          expect(
            normalizedCurrentBlockText,
            `Finances should contain "${expectedText}" (${type} ${key} ${year})`
          ).toContain(normalizeForCompare(expectedText));
        }
      }
    }
  }

  private getCpomYearRange(formData: TestCpomAjoutData): {
    minYear: number;
    maxYear: number;
  } {
    const mainActe = formData.actesAdministratifs[0];
    const startStr = mainActe?.startDate;
    const endStr = [
      mainActe?.endDate,
      ...(formData.avenants?.map((a) => a.endDate).filter(Boolean) ?? []),
    ]
      .filter(Boolean)
      .sort()
      .pop() as string | undefined;
    const startYear = startStr ? new Date(startStr).getFullYear() : START_YEAR;
    const endYear = endStr ? new Date(endStr).getFullYear() : CURRENT_YEAR;
    return {
      minYear: Math.max(startYear, START_YEAR),
      maxYear: Math.min(endYear, CURRENT_YEAR),
    };
  }
}
