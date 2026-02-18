import { expect, Page } from "@playwright/test";
import path from "path";

import { TIMEOUTS, URLS } from "../../constants";
import { SELECTORS } from "../../selectors";
import { getActesCategoryRegex } from "../../shared-utils";
import { ModificationData } from "../../test-data/types";
import { BasePage } from "../BasePage";

export class ModificationDocumentsPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  override async waitForLoad() {
    await this.waitForHeading(/Modification/i);
    await super.waitForLoad();
  }

  async fillForm(data: ModificationData) {
    const actes = data.actesAdministratifs ?? [];
    if (actes.length === 0) return;

    for (const acte of actes) {
      const groupLabel = getActesCategoryRegex(acte.category);
      const group = this.page.getByRole("group", { name: groupLabel });
      if ((await group.count()) === 0) continue;

      const addButton = group.getByRole("button", { name: /Ajouter/i });
      await addButton.click();

      const fileInputs = group.locator(SELECTORS.FILE_INPUT);
      const count = await fileInputs.count();
      const lastFileInput = fileInputs.nth(count - 1);
      await lastFileInput.waitFor({
        state: "attached",
        timeout: TIMEOUTS.FILE_UPLOAD,
      });
      await lastFileInput.setInputFiles(
        path.join(process.cwd(), acte.filePath)
      );

      await this.page
        .waitForLoadState("networkidle", { timeout: TIMEOUTS.FILE_UPLOAD })
        .catch(() => {});

      if (acte.startDate) {
        const startInputs = group.locator(
          'input[name^="actesAdministratifs."][name$=".startDate"]'
        );
        if ((await startInputs.count()) > 0) {
          await startInputs.last().fill(acte.startDate);
        }
      }
      if (acte.endDate) {
        const endInputs = group.locator(
          'input[name^="actesAdministratifs."][name$=".endDate"]'
        );
        if ((await endInputs.count()) > 0) {
          await endInputs.last().fill(acte.endDate);
        }
      }
      if (acte.categoryName) {
        const nameInputs = group.locator(
          'input[name^="actesAdministratifs."][name$=".categoryName"]'
        );
        if ((await nameInputs.count()) > 0) {
          await nameInputs.last().fill(acte.categoryName);
        }
      }

      const keyInputs = group.locator(
        'input[name^="actesAdministratifs."][name$=".key"]'
      );
      await expect(keyInputs.last()).toHaveValue(/.+/, {
        timeout: TIMEOUTS.FILE_UPLOAD,
      });
    }
  }

  async submit(structureId: number) {
    await this.page
      .waitForLoadState("networkidle", { timeout: TIMEOUTS.FILE_UPLOAD })
      .catch(() => {});
    const submitButton = this.page.locator(SELECTORS.SUBMIT_BUTTON);
    await submitButton.waitFor({
      state: "visible",
      timeout: TIMEOUTS.NAVIGATION,
    });
    await submitButton.click({ force: true });
    await this.page.waitForURL(URLS.structure(structureId), {
      timeout: 60000,
    });
  }
}
