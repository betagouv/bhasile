import { expect, Page } from "@playwright/test";
import path from "path";

import { ActeAdministratifCategory } from "@/types/file-upload.type";

import { TIMEOUTS } from "./constants";
import { SELECTORS } from "./selectors";
import { getActesCategoryRegex } from "./shared-utils";
import { ActeAdministratifData } from "./test-data/types";

/**
 * Resolves file path to absolute (handles relative paths from project root).
 */
function resolveActeFilePath(filePath: string): string {
  if (path.isAbsolute(filePath)) return filePath;
  return path.join(process.cwd(), filePath);
}

/**
 * Fills the actes administratifs form.
 * Works for both modification (adds one acte at a time per category) and finalisation
 * (groups by category, adds rows, then fills each).
 *
 * @param mode - "modification": iterate actes one-by-one, add each to its group
 *               "finalisation": group by category first, add rows to match count, fill by index
 */
export async function fillActesForm(
  page: Page,
  actes: ActeAdministratifData[],
  mode: "modification" | "finalisation"
): Promise<void> {
  if (actes.length === 0) return;

  if (mode === "modification") {
    for (const acte of actes) {
      await addAndFillActe(page, acte);
    }
  } else {
    const actesByCategory = actes.reduce(
      (acc, acte) => {
        acc[acte.category] = acc[acte.category] || [];
        acc[acte.category].push(acte);
        return acc;
      },
      {} as Record<string, ActeAdministratifData[]>
    );

    for (const category of ActeAdministratifCategory) {
      const entries = actesByCategory[category];
      if (!entries?.length) continue;

      const groupLabel = getActesCategoryRegex(category);
      const group = page.getByRole("group", { name: groupLabel });
      const addButton = group.getByRole("button", { name: /Ajouter/i });

      let rowCount = await group.locator(SELECTORS.FILE_INPUT).count();
      for (let i = rowCount; i < entries.length; i++) {
        await addButton.click();
      }

      rowCount = await group.locator(SELECTORS.FILE_INPUT).count();
      while (rowCount > entries.length) {
        const deleteButtons = group.locator(SELECTORS.DELETE_BUTTON);
        if ((await deleteButtons.count()) === 0) break;
        await deleteButtons.last().click();
        rowCount = await group.locator(SELECTORS.FILE_INPUT).count();
      }

      for (let i = 0; i < entries.length; i++) {
        const acte = entries[i];
        await fillActeFieldsAtGroupIndex(page, group, i, acte);
      }
    }
  }
}

async function addAndFillActe(
  page: Page,
  acte: ActeAdministratifData
): Promise<void> {
  const groupLabel = getActesCategoryRegex(acte.category);
  const group = page.getByRole("group", { name: groupLabel });
  if ((await group.count()) === 0) return;

  const addButton = group.getByRole("button", { name: /Ajouter/i });
  await addButton.click();

  const fileInputs = group.locator(SELECTORS.FILE_INPUT);
  const count = await fileInputs.count();
  const lastFileInput = fileInputs.nth(count - 1);
  await lastFileInput.waitFor({
    state: "attached",
    timeout: TIMEOUTS.FILE_UPLOAD,
  });
  await lastFileInput.setInputFiles(resolveActeFilePath(acte.filePath));

  await page
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

async function fillActeFieldsAtGroupIndex(
  page: Page,
  group: ReturnType<Page["locator"]>,
  index: number,
  acte: ActeAdministratifData
): Promise<void> {
  if (acte.startDate) {
    await fillIfExistsAtIndex(
      group,
      'input[name^="actesAdministratifs."][name$=".startDate"]',
      index,
      acte.startDate
    );
  }
  if (acte.endDate) {
    await fillIfExistsAtIndex(
      group,
      'input[name^="actesAdministratifs."][name$=".endDate"]',
      index,
      acte.endDate
    );
  }
  if (acte.categoryName) {
    await fillIfExistsAtIndex(
      group,
      'input[name^="actesAdministratifs."][name$=".categoryName"]',
      index,
      acte.categoryName
    );
  }

  const fileInput = group.locator(SELECTORS.FILE_INPUT).nth(index);
  await fileInput.waitFor({
    state: "attached",
    timeout: TIMEOUTS.FILE_UPLOAD,
  });
  await fileInput.setInputFiles(resolveActeFilePath(acte.filePath));

  await page
    .waitForLoadState("networkidle", { timeout: TIMEOUTS.FILE_UPLOAD })
    .catch(() => {});

  const keyInputInGroup = group
    .locator('input[name^="actesAdministratifs."][name$=".key"]')
    .nth(index);
  await expect(keyInputInGroup).toHaveValue(/.+/, {
    timeout: TIMEOUTS.FILE_UPLOAD,
  });
}

async function fillIfExistsAtIndex(
  group: ReturnType<Page["locator"]>,
  selector: string,
  index: number,
  value: string
): Promise<void> {
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
