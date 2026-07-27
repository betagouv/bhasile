import { expect, type Locator, type Page } from "@playwright/test";

import { Repartition } from "@/types/adresse.type";
import { PublicType, StructureType } from "@/types/structure.type";

import { uniqueFinessCode } from "../../../data/ids";
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

const byId = (id: string): string => `[id="${id}"]`;

type Brique = "creation" | "extension" | "contraction" | "fermeture";

const detectBrique = (url: string): Brique => {
  if (url.includes("/creation/")) {
    return "creation";
  }
  if (url.includes("/extension/")) {
    return "extension";
  }
  if (url.includes("/contraction/")) {
    return "contraction";
  }
  if (url.includes("/fermeture/")) {
    return "fermeture";
  }
  throw new Error(`Brique de transformation non reconnue: ${url}`);
};

const placesForBrique = (brique: Brique): number => {
  if (brique === "contraction") {
    return TRANSFORMATION_TEST_VALUES.contractionPlaces;
  }
  if (brique === "extension") {
    return TRANSFORMATION_TEST_VALUES.extensionPlaces;
  }
  return TRANSFORMATION_TEST_VALUES.creationPlaces;
};

const robustFill = async (locator: Locator, value: string): Promise<void> => {
  await expect(async () => {
    await locator.fill(value);
    await expect(locator).toHaveValue(value, { timeout: 1_000 });
  }).toPass({ timeout: 10_000 });
};

const fillEmptyFinessCodes = async (page: Page): Promise<void> => {
  const finessCodes = page.locator(
    'input[name^="structureFinesses."][name$=".finess.code"]'
  );
  for (let index = 0; index < (await finessCodes.count()); index++) {
    const field = finessCodes.nth(index);
    if (!(await field.inputValue())) {
      await field.fill(uniqueFinessCode());
    }
  }
};

export type FillContext = {
  creationNom: string;
  dnaCode: string;
  secondDnaCode: string;
  operateurSearch: string;
  structureType: StructureType;
};

export type FillOptions = {
  withAntennes?: boolean;
  withSecondDna?: boolean;
  withSecondContact?: boolean;
  withFiliale?: boolean;
  withQpvPmr?: boolean;
  withUploadActe?: boolean;
  withFermetureDoc?: boolean;
  typeBati?: Repartition;
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
  await robustFill(
    page.locator("#effectiveDate"),
    TRANSFORMATION_TEST_VALUES.effectiveDate
  );

  if (options.withFiliale) {
    // DSFR ToggleSwitch : l'`id` est sur le wrapper, la checkbox est `${id}-input`.
    await page.locator("#managed-by-a-filiale-input").check({ force: true });
    await page.locator("#filiale").fill("Filiale E2E");
  }

  await page.locator("#type").selectOption(context.structureType);

  const operateurInput = page.locator("#operateur");
  await operateurInput.waitFor({ state: "visible", timeout: 20_000 });
  if (await operateurInput.isEnabled()) {
    await fillAutocomplete(page, "#operateur", context.operateurSearch);
  }
  await page.locator('input[name="nom"]').fill(context.creationNom);
  await fillAdminAddressManually(page);

  if (options.withAntennes) {
    await page.locator('input[name="isMultiAntenne"]').check({ force: true });
    await page
      .locator('input[name="antennes.0.name"]')
      .waitFor({ state: "visible", timeout: 10_000 });
    await page.locator('input[name="antennes.0.name"]').fill("Site A");
    await fillAutocompleteAddress(page, byId("antennes.0.adresseComplete"));
    await page.locator('input[name="antennes.1.name"]').fill("Site B");
    await fillAutocompleteAddress(page, byId("antennes.1.adresseComplete"));
  }

  await page
    .locator(byId("dnaStructures.0.dna.code"))
    .selectOption(context.dnaCode);
  if (options.withSecondDna) {
    await page.locator('input[name="isMultiDna"]').check({ force: true });
    await page.getByRole("button", { name: /Ajouter un code DNA/i }).click();
    await page
      .locator(byId("dnaStructures.1.dna.code"))
      .selectOption(context.secondDnaCode);
  }

  await fillEmptyFinessCodes(page);

  await fillContact(page, 0);
  if (options.withSecondContact) {
    await page.getByRole("button", { name: /Ajouter un contact/i }).click();
    await fillContact(page, 1);
  }
};

export const fillExistingIdentification = async (page: Page): Promise<void> => {
  await robustFill(
    page.locator("#effectiveDate"),
    TRANSFORMATION_TEST_VALUES.effectiveDate
  );

  await fillEmptyFinessCodes(page);
  const perimetres = page.locator('input[name$=".perimetre"]');
  for (let index = 0; index < (await perimetres.count()); index++) {
    await perimetres.nth(index).fill("National");
  }
};

export const fillPlacesHebergement = async (
  page: Page,
  options: FillOptions = {}
): Promise<void> => {
  const brique = detectBrique(page.url());
  const places = placesForBrique(brique);

  await robustFill(
    page.locator(byId("structureTypologies.0.placesAutorisees")),
    String(places)
  );

  await page
    .locator(byId("structureTypologies.0.pmr"))
    .fill(options.withQpvPmr ? "2" : "0");

  // pmr/lgbt/fvvTeh sont requis pour toutes les briques utilisant
  // CurrentYearPlaces (création comme extension/contraction).
  await page.locator(byId("structureTypologies.0.lgbt")).fill("0");
  await page.locator(byId("structureTypologies.0.fvvTeh")).fill("0");

  if (brique === "creation") {
    await page.locator("#public").selectOption(PublicType.TOUT_PUBLIC);
    await page
      .locator("#typeBati")
      .selectOption(options.typeBati ?? Repartition.COLLECTIF);
    await fillAutocompleteAddress(page, byId("adresses.0.adresseComplete"));
    await page
      .locator(byId("adresses.0.adresseTypologies.0.placesAutorisees"))
      .fill(String(places));
  } else {
    // Structure existante : le type de bâti n'est pas un champ persisté
    // (donc jamais prérempli), il doit être sélectionné à chaque passage.
    await page
      .locator("#typeBati")
      .selectOption(options.typeBati ?? Repartition.COLLECTIF);
  }
};

export const fillActesStep = async (
  page: Page,
  options: FillOptions = {}
): Promise<void> => {
  if (!options.withUploadActe) {
    return;
  }
  try {
    const fieldset = acteFieldsetByLegend(page, "Arrêté d'autorisation");
    await fillActeStartEndDates(
      fieldset,
      TRANSFORMATION_TEST_VALUES.acteStartDate,
      TRANSFORMATION_TEST_VALUES.acteEndDate
    );
    await uploadActeDocument(fieldset);
  } catch (error) {
    console.error("Étape actes : remplissage de l'arrêté ignoré", error);
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
    } catch (error) {
      console.error(
        "Étape fermeture : ajout du document de fermeture ignoré",
        error
      );
    }
  }
};

export const fillCurrentStep = async (
  page: Page,
  context: FillContext,
  options: FillOptions = {}
): Promise<void> => {
  const url = page.url();
  if (url.includes("/places-et-hebergement")) {
    await fillPlacesHebergement(page, options);
    return;
  }
  if (url.includes("/actes-administratifs")) {
    await fillActesStep(page, options);
    return;
  }
  const brique = detectBrique(url);
  if (brique === "fermeture") {
    await fillFermetureStep(page, options);
  } else if (brique === "creation") {
    await fillCreationIdentification(page, context, options);
  } else {
    await fillExistingIdentification(page);
  }
};
