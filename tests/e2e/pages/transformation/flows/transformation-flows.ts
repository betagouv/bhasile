import type { Page } from "@playwright/test";

import { StructureType } from "@/types/structure.type";
import { TransformationType } from "@/types/transformation.type";

import { buildCreationNom } from "../../../data/transformation.factory";
import {
  enterViaCreationCta,
  enterViaHudaCta,
  enterViaStructureMenu,
} from "../entry.helper";
import {
  type FillContext,
  fillCurrentStep,
  type FillOptions,
} from "../fillers/step-fillers";
import {
  pickStructures,
  selectFirstOption,
  selectSources,
  selectTransformationType,
  submitSelection,
} from "../selection.helper";
import {
  clickEtapeSuivante,
  finalizeTransformation,
  gotoVerification,
} from "../transformation-nav.helper";

const OPERATEUR_SEARCH = "Opér";

const EMPTY_CONTEXT: FillContext = {
  creationNom: "",
  dnaCode: "",
  operateurSearch: OPERATEUR_SEARCH,
  structureType: StructureType.CADA,
};

const captureTransformationId = async (page: Page): Promise<number> => {
  await page.waitForURL(/\/structures\/transformation\/\d+(\/|$)/, {
    timeout: 30_000,
  });
  const match = page.url().match(/\/structures\/transformation\/(\d+)/);
  if (!match) {
    throw new Error(`transformationId introuvable dans l'URL: ${page.url()}`);
  }
  return Number(match[1]);
};

const walkSteps = async (
  page: Page,
  context: FillContext,
  stepConfigs: FillOptions[]
): Promise<void> => {
  for (const options of stepConfigs) {
    await fillCurrentStep(page, context, options);
    await clickEtapeSuivante(page);
  }
};

const finishFlow = async (
  page: Page,
  transformationId: number
): Promise<void> => {
  await gotoVerification(page, transformationId);
  await finalizeTransformation(page);
};

/** Flux 1 — Création ex-nihilo (kitchen-sink des champs optionnels + 1 upload). */
export const runCreationExNihilo = async (
  page: Page,
  params: { dnaCode: string }
): Promise<number> => {
  const context: FillContext = {
    creationNom: buildCreationNom(),
    dnaCode: params.dnaCode,
    operateurSearch: OPERATEUR_SEARCH,
    structureType: StructureType.CADA,
  };
  await enterViaCreationCta(page);
  await selectTransformationType(page, TransformationType.OUVERTURE_EX_NIHILO);
  await submitSelection(page);
  const transformationId = await captureTransformationId(page);
  await walkSteps(page, context, [
    {
      withAntennes: true,
      withSecondDna: true,
      withSecondContact: true,
      withFiness: true,
      withFiliale: true,
    },
    { typeBati: "DIFFUS", withQpvPmr: true },
    { withUploadActe: true },
  ]);
  await finishFlow(page, transformationId);
  return transformationId;
};

/** Flux 2 — Fermeture sèche (1 étape + upload doc de fermeture). */
export const runFermetureSeche = async (
  page: Page,
  params: { sourceStructureId: number }
): Promise<number> => {
  await enterViaStructureMenu(page, params.sourceStructureId);
  await selectFirstOption(page, "fermeture");
  await selectTransformationType(page, TransformationType.FERMETURE_SANS_TRANSFERT);
  await submitSelection(page);
  const transformationId = await captureTransformationId(page);
  await walkSteps(page, EMPTY_CONTEXT, [{ withFermetureDoc: true }]);
  await finishFlow(page, transformationId);
  return transformationId;
};

/** Flux 3 — Extension depuis structures qui contractent (contraction + extension, prefill). */
export const runExtensionFromContractions = async (
  page: Page,
  params: { extendedStructureId: number; contractionSourceIds: number[] }
): Promise<number> => {
  await enterViaStructureMenu(page, params.extendedStructureId);
  await selectFirstOption(page, "extension");
  await selectTransformationType(
    page,
    TransformationType.EXTENSION_DEPUIS_STRUCTURES_QUI_CONTRACTENT
  );
  await selectSources(page, {
    type: StructureType.CADA,
    structureIds: params.contractionSourceIds,
  });
  await submitSelection(page);
  const transformationId = await captureTransformationId(page);

  // Contraction (3 étapes) puis extension (3 étapes, avec changement d'adresse).
  const contractionSteps: FillOptions[] = params.contractionSourceIds.flatMap(
    () => [{}, {}, {}]
  );
  await walkSteps(page, EMPTY_CONTEXT, [
    ...contractionSteps,
    { changeAddress: true },
    {},
    {},
  ]);
  await finishFlow(page, transformationId);
  return transformationId;
};

/** Flux 4 — HUDA → nouveau CADA (N fermetures + création depuis sources). */
export const runHudaToNewCada = async (
  page: Page,
  params: { hudaSourceIds: number[]; dnaCode: string }
): Promise<number> => {
  const context: FillContext = {
    creationNom: buildCreationNom(),
    dnaCode: params.dnaCode,
    operateurSearch: OPERATEUR_SEARCH,
    structureType: StructureType.CADA,
  };
  await enterViaHudaCta(page);
  await selectTransformationType(
    page,
    TransformationType.TRANSFO_HUDA_VERS_CADA_NOUVEAU_MEME_OPERATEUR
  );
  await selectSources(page, { structureIds: params.hudaSourceIds });
  await submitSelection(page);
  const transformationId = await captureTransformationId(page);

  const fermetureSteps: FillOptions[] = params.hudaSourceIds.map(() => ({}));
  await walkSteps(page, context, [...fermetureSteps, {}, {}, {}]);
  await finishFlow(page, transformationId);
  return transformationId;
};

/** Flux 5 — HUDA → CADA existant (N fermetures + extension, héritage opérateur). */
export const runHudaToExistingCada = async (
  page: Page,
  params: { hudaSourceIds: number[]; cadaTargetId: number }
): Promise<number> => {
  await enterViaHudaCta(page);
  await selectTransformationType(
    page,
    TransformationType.TRANSFO_HUDA_VERS_CADA_EXISTANT_MEME_OPERATEUR
  );
  // Les HUDA d'abord (le bloc CADA hérite de leur opérateur et n'apparaît qu'ensuite).
  await selectSources(page, { structureIds: params.hudaSourceIds });
  await pickStructures(page, [params.cadaTargetId]);
  await submitSelection(page);
  const transformationId = await captureTransformationId(page);

  const fermetureSteps: FillOptions[] = params.hudaSourceIds.map(() => ({}));
  await walkSteps(page, EMPTY_CONTEXT, [...fermetureSteps, {}, {}, {}]);
  await finishFlow(page, transformationId);
  return transformationId;
};
