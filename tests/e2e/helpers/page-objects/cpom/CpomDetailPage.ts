import { expect, Page } from "@playwright/test";

import { getGranularityLabel } from "@/app/utils/cpom.util";
import { formatDate } from "@/app/utils/date.util";
import { formatCurrency } from "@/app/utils/number.util";
import { CURRENT_YEAR, START_YEAR } from "@/constants";

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
    const dateEnd = [
      mainActe?.endDate,
      ...(formData.avenants?.map((a) => a.endDate).filter(Boolean) ?? []),
    ]
      .filter(Boolean)
      .sort()
      .pop() as string | undefined;
    const dateEndFormatted = dateEnd ? formatDate(dateEnd) : null;

    if (dateStart) {
      await expect(descriptionSection).toContainText(dateStart);
    }
    if (dateEndFormatted) {
      await expect(descriptionSection).toContainText(dateEndFormatted);
    }
  }

  async verifyFinances(
    financeData: TestCpomFinanceData,
    formData: TestCpomAjoutData
  ): Promise<void> {
    await this.waitForLoad();

    const financesBlock = this.page.locator("#finances");
    await expect(financesBlock).toBeVisible({ timeout: TIMEOUTS.NAVIGATION });

    const blockText = (await financesBlock.textContent()) ?? "";
    const normalizeForCompare = (s: string) =>
      s
        .replace(/\s/g, "")
        .replace(/\u00a0/g, "")
        .replace(/\u202f/g, "");

    const { minYear, maxYear } = this.getCpomYearRange(formData);

    for (const [yearStr, values] of Object.entries(financeData)) {
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
          continue;
        }

        const expectedText = formatCurrency(value as number | string);
        expect(
          normalizeForCompare(blockText),
          `Finances should contain "${expectedText}" (${key} ${year})`
        ).toContain(normalizeForCompare(expectedText));
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
