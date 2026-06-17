import type { Page } from "@playwright/test";

import { fillAutocomplete } from "../shared/autocomplete.helper";

export type FirstSelectedOption = "extension" | "contraction" | "fermeture";

const VALIDATE_BUTTON = "Je valide";

// La liste de structures n'est fetchée que si type + opérateur + département
// sont tous renseignés (useStructuresSelection). On filtre sur l'opérateur et
// le département des sources seedées (operateurId 1 = "Opérateur 1", dept 75).
const FILTER_OPERATEUR_SEARCH = "Opér";
const FILTER_DEPARTEMENT_SEARCH = "75";

/**
 * Sélectionne une option de `RadioCardGroup` — format e2e-legacy : clic du
 * label adjacent à l'input (`${selector} + label`) avec `force`.
 */
const selectRadioCard = async (
  page: Page,
  inputId: string
): Promise<void> => {
  await page.click(`#${inputId} + label`, { force: true });
};

/** Choisit une option de cas de figure (`RadioCardGroup`, id `type-<valeur>`). */
export const selectTransformationType = async (
  page: Page,
  typeValue: string
): Promise<void> => {
  await selectRadioCard(page, `type-${typeValue}`);
};

/** Choisit le premier niveau extension/contraction/fermeture (parcours fiche). */
export const selectFirstOption = async (
  page: Page,
  option: FirstSelectedOption
): Promise<void> => {
  await selectRadioCard(page, `firstSelectedOption-${option}`);
};

/** Sélectionne une structure source par son id (label visible, checkbox `sr-only`). */
export const pickStructureById = async (
  page: Page,
  structureId: number
): Promise<void> => {
  const label = page.locator(`label[for="structure-${structureId}"]`);
  const checkbox = page.locator(`#structure-${structureId}`);
  await label.waitFor({ state: "visible", timeout: 20_000 });
  for (let attempt = 0; attempt < 5; attempt++) {
    await label.click();
    if (await checkbox.isChecked().catch(() => false)) {
      return;
    }
    await page.waitForTimeout(300);
  }
  throw new Error(`Structure ${structureId} non sélectionnée`);
};

/** Sélectionne plusieurs structures dans l'ordre (blocs hérités au fur et à mesure). */
export const pickStructures = async (
  page: Page,
  structureIds: number[]
): Promise<void> => {
  for (const structureId of structureIds) {
    await pickStructureById(page, structureId);
  }
};

/**
 * Renseigne les filtres d'un bloc (type si présent + opérateur + département)
 * pour déclencher le fetch des structures, puis sélectionne les sources.
 */
export const selectSources = async (
  page: Page,
  params: { type?: string; structureIds: number[] }
): Promise<void> => {
  await fillAutocomplete(page, "#operateur", FILTER_OPERATEUR_SEARCH);
  if (params.type) {
    // Format e2e-legacy (SelectionPage) : le DSFR `<Select>` se cible par classe
    // `select.fr-select` (l'id est sur le wrapper, pas sur le <select>).
    const typeSelect = page.locator("select.fr-select").first();
    if (await typeSelect.isVisible().catch(() => false)) {
      await typeSelect.selectOption(params.type);
    }
  }
  await fillAutocomplete(page, "#departement", FILTER_DEPARTEMENT_SEARCH);
  await pickStructures(page, params.structureIds);
};

/** Valide l'étape "Cas de figure" (bouton actif quand type + sélections complètes). */
export const submitSelection = async (page: Page): Promise<void> => {
  await page.getByRole("button", { name: VALIDATE_BUTTON, exact: true }).click();
};
