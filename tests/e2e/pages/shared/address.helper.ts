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

/** Requête qui renvoie une suggestion réelle de l'autocomplete d'adresse (BAN). */
export const PARIS_ADDRESS_QUERY = "55 Rue Saint-Dominique 75007 Paris";

/**
 * Adresse administrative en saisie manuelle (déterministe, sans dépendre de
 * l'autocomplete géographique). Le formulaire expose un bouton de bascule
 * "Saisir l'adresse manuellement" puis les champs nommés `adresseAdministrative`,
 * `codePostalAdministratif`, `communeAdministrative`.
 */
export const fillAdminAddressManually = async (
  page: Page,
  address: ManualAddress = PARIS_ADDRESS
): Promise<void> => {
  const manualToggle = page.getByRole("button", {
    name: /Saisir l.adresse manuellement/i,
  });
  if (await manualToggle.first().isVisible().catch(() => false)) {
    await manualToggle.first().click();
  }
  await page.locator('input[name="adresseAdministrative"]').fill(address.adresse);
  await page
    .locator('input[name="codePostalAdministratif"]')
    .fill(address.codePostal);
  await page
    .locator('input[name="communeAdministrative"]')
    .fill(address.commune);
};

/**
 * Adresse via autocomplete (antennes, hébergement) — sélectionne la première
 * suggestion BAN. `inputSelector` ex. `#adresses.0.adresseComplete`.
 */
export const fillAutocompleteAddress = async (
  page: Page,
  inputSelector: string,
  query: string = PARIS_ADDRESS_QUERY
): Promise<void> => {
  await fillAutocomplete(page, inputSelector, query);
};
