import type { Page } from "@playwright/test";

/**
 * Remplit un champ autocomplete DSFR (opérateur, département, adresse…) et
 * sélectionne la première suggestion. Pattern repris des tests e2e-legacy
 * (éprouvé) : remplissage one-shot + suggestion `[role="option"]`.
 */
export const fillAutocomplete = async (
  page: Page,
  inputSelector: string,
  searchTerm: string
): Promise<void> => {
  await page
    .locator(inputSelector)
    .waitFor({ state: "visible", timeout: 20_000 });
  await page.click(inputSelector);
  await page.fill(inputSelector, searchTerm);

  const firstSuggestion = page.locator('[role="option"]').first();
  await firstSuggestion.waitFor({ state: "visible", timeout: 15_000 });
  await firstSuggestion.click();
};
