import type { Page } from "@playwright/test";

import { OPERATEUR_SEARCH } from "../../data/transformation.factory";
import { fillAutocomplete } from "../shared/autocomplete.helper";

export type FirstSelectedOption = "extension" | "contraction" | "fermeture";

const VALIDATE_BUTTON = "Je valide";

const FILTER_DEPARTEMENT_SEARCH = "75";

const selectRadioCard = async (page: Page, inputId: string): Promise<void> => {
  await page.click(`#${inputId} + label`, { force: true });
};

export const selectTransformationType = async (
  page: Page,
  typeValue: string
): Promise<void> => {
  await selectRadioCard(page, `type-${typeValue}`);
};

export const selectFirstOption = async (
  page: Page,
  option: FirstSelectedOption
): Promise<void> => {
  await selectRadioCard(page, `firstSelectedOption-${option}`);
};

export const pickStructureById = async (
  page: Page,
  structureId: number,
  maxAttempts = 5
): Promise<void> => {
  const label = page.locator(`label[for="structure-${structureId}"]`);
  const checkbox = page.locator(`#structure-${structureId}`);
  await label.waitFor({ state: "visible", timeout: 20_000 });
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await label.click();
    if (await checkbox.isChecked().catch(() => false)) {
      return;
    }
    await page.waitForTimeout(300);
  }
  throw new Error(`Structure ${structureId} non sélectionnée`);
};

export const pickStructures = async (
  page: Page,
  structureIds: number[]
): Promise<void> => {
  for (const structureId of structureIds) {
    await pickStructureById(page, structureId);
  }
};

export const selectSources = async (
  page: Page,
  params: { structureIds: number[] }
): Promise<void> => {
  await fillAutocomplete(page, "#operateur", OPERATEUR_SEARCH);
  await fillAutocomplete(page, "#departement", FILTER_DEPARTEMENT_SEARCH);
  await pickStructures(page, params.structureIds);
};

export const submitSelection = async (page: Page): Promise<void> => {
  await page
    .getByRole("button", { name: VALIDATE_BUTTON, exact: true })
    .click();
};
