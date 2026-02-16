import { expect, Page } from "@playwright/test";

import { ActeAdministratifCategory } from "@/types/file-upload.type";

import { TIMEOUTS, URLS } from "../../constants";
import { SELECTORS } from "../../selectors";
import { getActesCategoryRegex } from "../../shared-utils";
import { TestStructureData } from "../../test-data/types";
import { BasePage } from "../BasePage";

export class FinalisationDocumentsPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }
  async fillForm(data: TestStructureData) {
    const actes = data.actesAdministratifs ?? [];
    const actesByCategory = actes.reduce(
      (acc, acte) => {
        acc[acte.category] = acc[acte.category] || [];
        acc[acte.category].push(acte);
        return acc;
      },
      {} as Record<string, typeof actes>
    );

    for (const category of ActeAdministratifCategory) {
      const entries = actesByCategory[category];
      if (!entries?.length) {continue;}
      const groupLabel = getActesCategoryRegex(category);
      const group = this.page.getByRole("group", { name: groupLabel });
      const addButton = group.getByRole("button", { name: /Ajouter/i });

      let rowCount = await group.locator(SELECTORS.FILE_INPUT).count();
      for (let i = rowCount; i < entries.length; i++) {
        await addButton.click();
      }

      rowCount = await group.locator(SELECTORS.FILE_INPUT).count();
      while (rowCount > entries.length) {
        const deleteButtons = group.locator(SELECTORS.DELETE_BUTTON);
        if ((await deleteButtons.count()) === 0) {
          break;
        }
        await deleteButtons.last().click();
        rowCount = await group.locator(SELECTORS.FILE_INPUT).count();
      }

      for (let i = 0; i < entries.length; i++) {
        const acte = entries[i];
        if (acte.startDate) {
          await this.fillIfExistsAtIndex(
            group,
            'input[name^="actesAdministratifs."][name$=".startDate"]',
            i,
            acte.startDate
          );
        }
        if (acte.endDate) {
          await this.fillIfExistsAtIndex(
            group,
            'input[name^="actesAdministratifs."][name$=".endDate"]',
            i,
            acte.endDate
          );
        }
        if (acte.categoryName) {
          await this.fillIfExistsAtIndex(
            group,
            'input[name^="actesAdministratifs."][name$=".categoryName"]',
            i,
            acte.categoryName
          );
        }
        // Use i-th row in this group (works for both autorisee and subventionnée category order)
        const fileInput = group.locator(SELECTORS.FILE_INPUT).nth(i);
        await fileInput.setInputFiles(acte.filePath);

        await this.page
          .waitForLoadState("networkidle", { timeout: TIMEOUTS.FILE_UPLOAD })
          .catch(() => {});

        const keyInputInGroup = group
          .locator('input[name^="actesAdministratifs."][name$=".key"]')
          .nth(i);
        await expect(keyInputInGroup).toHaveValue(/.+/, {
          timeout: TIMEOUTS.FILE_UPLOAD,
        });
      }
    }
  }

  async submit(structureId: number, expectValidationFailure = false) {
    if (expectValidationFailure) {
      await this.submitAndExpectNoNavigation();
    } else {
      await this.page
        .waitForLoadState("networkidle", {
          timeout: TIMEOUTS.FILE_UPLOAD,
        })
        .catch(() => {});
      const submitButton = this.page.locator(SELECTORS.SUBMIT_BUTTON);
      await submitButton.waitFor({
        state: "visible",
        timeout: TIMEOUTS.NAVIGATION,
      });
      await submitButton.click({ force: true });
      await this.page.waitForURL(
        URLS.finalisationStep(structureId, "06-notes"),
        { timeout: TIMEOUTS.SUBMIT, waitUntil: "commit" }
      );
    }
  }

  private async fillIfExistsAtIndex(
    group: ReturnType<Page["locator"]>,
    selector: string,
    index: number,
    value: string
  ) {
    const input = group.locator(selector);
    if ((await input.count()) > index) {
      const inputElement = input.nth(index);
      await inputElement.waitFor({
        state: "visible",
        timeout: TIMEOUTS.NAVIGATION,
      });
      await inputElement.fill(value);
    }
  }
}
