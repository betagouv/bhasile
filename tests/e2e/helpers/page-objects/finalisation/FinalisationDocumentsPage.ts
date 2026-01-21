import { Page } from "@playwright/test";

import { TestStructureData } from "../../test-data";

export class FinalisationDocumentsPage {
  constructor(private page: Page) {}

  async waitForLoad() {
    await this.page.waitForSelector('button[type="submit"]', {
      timeout: 10000,
    });
  }

  async fillMinimalData(data: TestStructureData) {
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
      const groupLabel = getActeGroupLabel(category);
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
    const nextUrl = `http://localhost:3000/structures/${structureId}/finalisation/06-notes`;
    await this.page.click('button[type="submit"]');
    await this.page.waitForURL(nextUrl, { timeout: 10000 });
  }

  private async fillIfExists(
    group: ReturnType<Page["locator"]>,
    selector: string,
    value: string
  ) {
    const input = group.locator(selector);
    if ((await input.count()) > 0) {
      await input.last().fill(value);
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
      await input.nth(index).fill(value);
    }
  }
}

const getActeGroupLabel = (category: string): RegExp => {
  switch (category) {
    case "ARRETE_AUTORISATION":
      return /Arrêtés d'autorisation/i;
    case "ARRETE_TARIFICATION":
      return /Arrêtés de tarification/i;
    case "CONVENTION":
      return /Conventions/i;
    case "CPOM":
      return /CPOM/i;
    case "AUTRE":
      return /Autres documents/i;
    default:
      return new RegExp(category, "i");
  }
};
