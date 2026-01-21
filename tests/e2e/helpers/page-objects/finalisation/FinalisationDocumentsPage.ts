import { Page } from "@playwright/test";

import { TIMEOUTS, URLS } from "../../constants";
import { getActesCategoryRegex } from "../../shared-utils";
import { TestStructureData } from "../../test-data";

export class FinalisationDocumentsPage {
  constructor(private page: Page) {}

  async waitForLoad() {
    await this.page.waitForSelector('button[type="submit"]', {
      timeout: TIMEOUTS.NAVIGATION,
    });
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

      let rowCount = await group.locator('input[type="file"]').count();
      for (let i = rowCount; i < entries.length; i++) {
        await addButton.click();
      }

      rowCount = await group.locator('input[type="file"]').count();
      while (rowCount > entries.length) {
        const deleteButtons = group.locator('button[title="Supprimer"]');
        if ((await deleteButtons.count()) === 0) {
          break;
        }
        await deleteButtons.last().click();
        rowCount = await group.locator('input[type="file"]').count();
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
        const fileInput = group.locator('input[type="file"]').nth(i);
        await fileInput.setInputFiles(acte.filePath);
      }
    }
  }

  async submit(structureId: number) {
    await this.page.click('button[type="submit"]');
    await this.page.waitForURL(URLS.finalisationStep(structureId, "06-notes"), {
      timeout: TIMEOUTS.NAVIGATION,
    });
  }

  private async fillIfExistsAtIndex(
    group: ReturnType<Page["locator"]>,
    selector: string,
    index: number,
    value: string
  ) {
    const input = group.locator(selector);
    if ((await input.count()) > index) {
      await input.nth(index).fill(value);
    }
  }
}
