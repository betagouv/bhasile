import type { Locator, Page } from "@playwright/test";

import { StructureType } from "@/types/structure.type";

import { TRANSFORMATION_TEST_VALUES } from "../../../data/transformation.factory";
import {
  acteFieldsetByLegend,
  fillActeName,
  fillActeStartEndDates,
  uploadActeDocument,
} from "../../shared/actes.helper";
import {
  fillAdminAddressManually,
  fillAutocompleteAddress,
} from "../../shared/address.helper";
import { fillAutocomplete } from "../../shared/autocomplete.helper";

/** Sélecteur d'attribut pour les ids RHF contenant des points (échappement CSS). */
const byId = (id: string): string => `[id="${id}"]`;

const isVisible = (page: Page, selector: string): Promise<boolean> =>
  page
    .locator(selector)
    .first()
    .isVisible()
    .catch(() => false);

/**
 * Remplit un champ et vérifie que la valeur tient (les formulaires de structure
 * existante re-render au chargement du prefill → une saisie unique se perd).
 */
const robustFill = async (
  page: Page,
  locator: Locator,
  value: string
): Promise<void> => {
  await locator.waitFor({ state: "visible", timeout: 10_000 }).catch(() => {});
  // Laisse le prefill (reset des defaultValues) se poser AVANT de saisir.
  await page.waitForTimeout(500);
  for (let attempt = 0; attempt < 3; attempt++) {
    // Vraie frappe (click + tout sélectionner + taper) : un simple `fill` est
    // parfois écrasé par le re-render du prefill.
    await locator.click().catch(() => {});
    await locator.press("ControlOrMeta+a").catch(() => {});
    await locator.pressSequentially(value, { delay: 40 }).catch(() => {});
    await page.waitForTimeout(200);
    if ((await locator.inputValue().catch(() => "")) === value) {
      return;
    }
  }
};

export type FillContext = {
  creationNom: string;
  dnaCode: string;
  operateurSearch: string;
  structureType: StructureType;
};

export type FillOptions = {
  withAntennes?: boolean;
  withSecondDna?: boolean;
  withSecondContact?: boolean;
  withFiness?: boolean;
  withFiliale?: boolean;
  withQpvPmr?: boolean;
  withUploadActe?: boolean;
  withFermetureDoc?: boolean;
  changeAddress?: boolean;
  typeBati?: "COLLECTIF" | "DIFFUS" | "MIXTE";
};

const fillContact = async (page: Page, index: number): Promise<void> => {
  await page.locator(byId(`contacts.${index}.prenom`)).fill("Paul");
  await page.locator(byId(`contacts.${index}.nom`)).fill("Durand");
  await page.locator(byId(`contacts.${index}.role`)).fill("Directeur");
  await page
    .locator(byId(`contacts.${index}.email`))
    .fill(`contact${index}@example.fr`);
  await page.locator(byId(`contacts.${index}.telephone`)).fill("0102030405");
};

export const fillCreationIdentification = async (
  page: Page,
  context: FillContext,
  options: FillOptions = {}
): Promise<void> => {
  await page
    .locator("#creationDate")
    .fill(TRANSFORMATION_TEST_VALUES.effectiveDate);

  if (options.withFiliale) {
    await page.locator("#managed-by-a-filiale").check({ force: true });
    await page.locator("#filiale").fill("Filiale E2E");
  }

  await page.locator("#type").selectOption(context.structureType);
  await fillAutocomplete(page, "#operateur", context.operateurSearch);
  await page.locator('input[name="nom"]').fill(context.creationNom);
  await fillAdminAddressManually(page);

  if (options.withAntennes) {
    await page.locator('input[name="isMultiAntenne"]').check({ force: true });
    await page.locator('input[name="antennes.0.name"]').fill("Site A");
    await fillAutocompleteAddress(page, byId("antennes.0.adresseComplete"));
    await page
      .getByRole("button", { name: /Ajouter un site administratif/i })
      .click();
    await page.locator('input[name="antennes.1.name"]').fill("Site B");
    await fillAutocompleteAddress(page, byId("antennes.1.adresseComplete"));
  }

  if (options.withSecondDna) {
    await page.locator('input[name="isMultiDna"]').check({ force: true });
  }
  await page.locator(byId("dnaStructures.0.dna.code")).selectOption(context.dnaCode);

  if (options.withFiness) {
    await page.locator(byId("finesses.0.code")).fill("E2E-FINESS-001");
  }

  await fillContact(page, 0);
  if (options.withSecondContact) {
    await page.getByRole("button", { name: /Ajouter un contact/i }).click();
    await fillContact(page, 1);
  }
};

export const fillExistingIdentification = async (
  page: Page,
  options: FillOptions = {}
): Promise<void> => {
  await page.waitForLoadState("networkidle", { timeout: 1_500 }).catch(() => {});
  await robustFill(
    page,
    page.locator("#effectiveDate"),
    TRANSFORMATION_TEST_VALUES.effectiveDate
  );

  // "Adresse administrative changée ?" : il FAUT répondre (sinon l'adresse
  // pré-remplie n'est pas confirmée). "Non" garde l'adresse d'origine.
  const group = page.locator('[aria-labelledby="hasAdresseChanged-title"]');
  await group
    .getByRole("radio", { name: options.changeAddress ? "Oui" : "Non" })
    .check({ force: true });
  if (options.changeAddress) {
    await fillAdminAddressManually(page);
  }

  // Champs requis NON pré-remplis : le code FINESS et le périmètre des contacts.
  if (await isVisible(page, byId("finesses.0.code"))) {
    await robustFill(page, page.locator(byId("finesses.0.code")), "E2E-FIN-EXIST");
  }
  if (await isVisible(page, byId("contacts.0.perimetre"))) {
    await robustFill(page, page.locator(byId("contacts.0.perimetre")), "National");
  }
  // DNA, contacts (hors périmètre) et adresses sont pré-remplis (copyStructureVersion).
};

export const fillPlacesHebergement = async (
  page: Page,
  options: FillOptions = {}
): Promise<void> => {
  const url = page.url();
  const isContraction = url.includes("/contraction/");
  const isExtension = url.includes("/extension/");
  const isCreation = url.includes("/creation/") || url.includes("/ouverture/");

  const places = isContraction
    ? TRANSFORMATION_TEST_VALUES.contractionPlaces
    : isExtension
      ? TRANSFORMATION_TEST_VALUES.extensionPlaces
      : TRANSFORMATION_TEST_VALUES.creationPlaces;

  await page.waitForLoadState("networkidle", { timeout: 1_500 }).catch(() => {});
  // Cible le spinbutton visible par son nom (l'id RHF diffère selon le form).
  await robustFill(
    page,
    page.getByRole("spinbutton", {
      name: /Nombre total de places autoris/i,
    }),
    String(places)
  );

  if (options.withQpvPmr) {
    await page.locator(byId("structureTypologies.0.pmr")).fill("2");
  }

  // public / type de bâti / hébergement : uniquement en création. Pour une
  // structure existante (extension/contraction) ils sont pré-remplis depuis la
  // source — les re-régler casserait les valeurs (et l'option n'existe pas).
  if (isCreation) {
    await page.locator("#public").selectOption("TOUT_PUBLIC");
    await page.locator("#typeBati").selectOption(options.typeBati ?? "COLLECTIF");
    await fillAutocompleteAddress(page, byId("adresses.0.adresseComplete"));
    await page
      .locator(byId("adresses.0.adresseTypologies.0.placesAutorisees"))
      .fill(String(places));
  }
};

export const fillActesStep = async (
  page: Page,
  options: FillOptions = {}
): Promise<void> => {
  if (!options.withUploadActe) {
    return; // actes optionnels → l'étape se valide vide
  }
  // Upload best-effort : les actes étant optionnels, un souci d'upload ne doit
  // pas casser le flux de finalisation.
  try {
    const fieldset = acteFieldsetByLegend(page, "Arrêté d'autorisation");
    await fillActeStartEndDates(
      fieldset,
      TRANSFORMATION_TEST_VALUES.acteStartDate,
      TRANSFORMATION_TEST_VALUES.acteEndDate
    );
    await uploadActeDocument(fieldset);
  } catch {
    // ignore
  }
};

export const fillFermetureStep = async (
  page: Page,
  options: FillOptions = {}
): Promise<void> => {
  await page
    .locator("#effectiveDate")
    .fill(TRANSFORMATION_TEST_VALUES.effectiveDate);

  if (options.withFermetureDoc) {
    // Upload best-effort (document de fermeture optionnel).
    try {
      const fieldset = acteFieldsetByLegend(
        page,
        "Arrêtés ou documents actant la fermeture"
      );
      await fieldset
        .getByRole("button", { name: /Ajouter un document/i })
        .click();
      await fillActeName(fieldset, "Arrêté de fermeture E2E");
      await uploadActeDocument(fieldset);
    } catch {
      // ignore
    }
  }
};

/**
 * Remplit l'étape courante en détectant le formulaire affiché (résilient au
 * nommage des routes). Ordre : places → identification création → identification
 * structure existante → fermeture → actes (fallback).
 */
export const fillCurrentStep = async (
  page: Page,
  context: FillContext,
  options: FillOptions = {}
): Promise<void> => {
  if (await isVisible(page, "#typeBati")) {
    await fillPlacesHebergement(page, options);
    return;
  }
  if (await isVisible(page, "#type")) {
    await fillCreationIdentification(page, context, options);
    return;
  }
  if (await isVisible(page, '[aria-labelledby="hasAdresseChanged-title"]')) {
    await fillExistingIdentification(page, options);
    return;
  }
  if (await isVisible(page, "#effectiveDate")) {
    await fillFermetureStep(page, options);
    return;
  }
  await fillActesStep(page, options);
};
