import type { Page } from "@playwright/test";

import { fillAutocomplete } from "./autocomplete.helper";

export type ManualAddress = {
  adresse: string;
  codePostal: string;
  commune: string;
};

export const PARIS_ADDRESS: ManualAddress = {
  adresse: "55 Rue Saint-Dominique",
  codePostal: "75007",
  commune: "Paris",
};

export const PARIS_ADDRESS_QUERY = "55 Rue Saint-Dominique 75007 Paris";

export const fillAdminAddressManually = async (
  page: Page,
  address: ManualAddress = PARIS_ADDRESS
): Promise<void> => {
  const manualToggle = page.getByRole("button", {
    name: /Saisir l.adresse manuellement/i,
  });
  if (
    await manualToggle
      .first()
      .isVisible()
      .catch(() => false)
  ) {
    await manualToggle.first().click();
  }
  await page
    .locator('input[name="adresseAdministrative"]')
    .last()
    .fill(address.adresse);
  await page
    .locator('input[name="codePostalAdministratif"]')
    .last()
    .fill(address.codePostal);
  await page
    .locator('input[name="communeAdministrative"]')
    .last()
    .fill(address.commune);
};

export const fillAutocompleteAddress = async (
  page: Page,
  inputSelector: string,
  query: string = PARIS_ADDRESS_QUERY
): Promise<void> => {
  await fillAutocomplete(page, inputSelector, query);
};
