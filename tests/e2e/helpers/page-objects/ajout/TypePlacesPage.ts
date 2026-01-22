import { Page } from "@playwright/test";
import { expect } from "@playwright/test";

import { URLS } from "../../constants";
import { FormHelper } from "../../form-helper";
import { TestStructureData } from "../../test-data/types";
import { BasePage } from "../BasePage";

export class TypePlacesPage extends BasePage {
  private formHelper: FormHelper;

  constructor(page: Page) {
    super(page);
    this.formHelper = new FormHelper(page);
  }
  async fillForm(data: TestStructureData) {
    const rows = this.page
      .locator("table tr")
      .filter({ has: this.page.locator("td") });
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThanOrEqual(data.structureTypologies.length);

    const typologiesByYear = new Map<
      number,
      TestStructureData["structureTypologies"][number]
    >();
    const remaining = [...data.structureTypologies];

    for (const typologie of data.structureTypologies) {
      const maybeYear = (typologie as { year?: number }).year;
      if (typeof maybeYear === "number") {
        typologiesByYear.set(maybeYear, typologie);
      }
    }

    const pickTypologie = (year?: number) => {
      if (year && typologiesByYear.has(year)) {
        const match = typologiesByYear.get(year);
        if (match) {
          const index = remaining.indexOf(match);
          if (index >= 0) {
            remaining.splice(index, 1);
          }
          return match;
        }
      }
      return remaining.shift();
    };

    for (let i = 0; i < rowCount; i += 1) {
      const row = rows.nth(i);
      const yearText = (await row.locator("td").first().textContent()) || "";
      const year = Number(yearText.trim());
      const typologie = pickTypologie(Number.isNaN(year) ? undefined : year);
      if (!typologie) {
        break;
      }

      // Fill typologie fields (date is auto-filled by the form)
      await this.formHelper.fillInput(
        `input[id="typologies.${i}.placesAutorisees"]`,
        typologie.placesAutorisees.toString()
      );
      await this.formHelper.fillInput(
        `input[id="typologies.${i}.pmr"]`,
        typologie.pmr.toString()
      );
      await this.formHelper.fillInput(
        `input[id="typologies.${i}.lgbt"]`,
        typologie.lgbt.toString()
      );
      await this.formHelper.fillInput(
        `input[id="typologies.${i}.fvvTeh"]`,
        typologie.fvvTeh.toString()
      );
    }
  }

  async submit(dnaCode: string) {
    await this.submitAndWaitForUrl(URLS.ajoutStep(dnaCode, "04-documents"));
  }
}
