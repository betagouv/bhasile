import { expect, Page } from "@playwright/test";

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

    for (const [category, entries] of Object.entries(actesByCategory)) {
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
        const fileInput = group.locator(SELECTORS.FILE_INPUT).nth(i);
        await fileInput.setInputFiles(acte.filePath);

        // Wait for upload to complete - check that the key input is populated
        const keyInput = this.page.locator(
          `input[name="actesAdministratifs.${i}.key"]`
        );
        await expect(keyInput).toHaveValue(/.+/, {
          timeout: TIMEOUTS.NAVIGATION,
        });
      }
    }
  }

  async submit(structureId: number) {
    await this.submitAndWaitForUrl(
      URLS.finalisationStep(structureId, "06-notes")
    );
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
