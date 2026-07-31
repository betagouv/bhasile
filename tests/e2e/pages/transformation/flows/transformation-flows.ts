import type { Page } from "@playwright/test";

import { Repartition } from "@/types/adresse.type";
import { StructureType } from "@/types/structure.type";
import { TransformationType } from "@/types/transformation.type";

import {
  buildCreationNom,
  OPERATEUR_SEARCH,
} from "../../../data/transformation.factory";
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

const STEPS_PER_BRIQUE = 3;

export const creationContext = (
  dnaCodes: string[],
  creationNom: string = buildCreationNom()
): FillContext => ({
  creationNom,
  dnaCode: dnaCodes[0] ?? "",
  secondDnaCode: dnaCodes[1] ?? "",
  operateurSearch: OPERATEUR_SEARCH,
  structureType: StructureType.CADA,
});

const EMPTY_CONTEXT: FillContext = creationContext([], "");

const emptySteps = (count: number): FillOptions[] =>
  Array.from({ length: count }, () => ({}));

export const captureTransformationId = async (page: Page): Promise<number> => {
  await page.waitForURL(/\/structures\/transformation\/\d+(\/|$)/, {
    timeout: 30_000,
  });
  const match = page.url().match(/\/structures\/transformation\/(\d+)/);
  if (!match) {
    throw new Error(`transformationId introuvable dans l'URL: ${page.url()}`);
  }
  await page.waitForURL(/\/structures\/transformation\/\d+\/[a-z-]+\/\d+\/\w/, {
    timeout: 30_000,
  });
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

/** Création ex-nihilo (remplit tous les champs optionnels + 1 upload). */
export const runCreationExNihilo = async (
  page: Page,
  params: { dnaCodes: string[] }
): Promise<number> => {
  const context = creationContext(params.dnaCodes);
  await enterViaCreationCta(page);
  await selectTransformationType(page, TransformationType.OUVERTURE_EX_NIHILO);
  await submitSelection(page);
  const transformationId = await captureTransformationId(page);
  await walkSteps(page, context, [
    {
      withAntennes: true,
      withSecondDna: true,
      withSecondContact: true,
      withFiliale: true,
    },
    { typeBati: Repartition.DIFFUS, withQpvPmr: true },
    { withUploadActe: true },
  ]);
  await finishFlow(page, transformationId);
  return transformationId;
};

/** Fermeture sèche (1 étape + upload doc de fermeture). */
export const runFermetureSeche = async (
  page: Page,
  params: { sourceStructureId: number }
): Promise<number> => {
  await enterViaStructureMenu(page, params.sourceStructureId);
  await selectFirstOption(page, "fermeture");
  await selectTransformationType(
    page,
    TransformationType.FERMETURE_SANS_TRANSFERT
  );
  await submitSelection(page);
  const transformationId = await captureTransformationId(page);
  await walkSteps(page, EMPTY_CONTEXT, [{ withFermetureDoc: true }]);
  await finishFlow(page, transformationId);
  return transformationId;
};

/** Extension depuis structures qui contractent (contraction + extension, prefill). */
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
    structureIds: params.contractionSourceIds,
    fixedDepartement: true,
  });
  await submitSelection(page);
  const transformationId = await captureTransformationId(page);

  const briques = params.contractionSourceIds.length + 1;
  await walkSteps(page, EMPTY_CONTEXT, emptySteps(briques * STEPS_PER_BRIQUE));
  await finishFlow(page, transformationId);
  return transformationId;
};

/** HUDA → nouveau CADA (N fermetures + création depuis sources). */
export const runHudaToNewCada = async (
  page: Page,
  params: { hudaSourceIds: number[]; dnaCode: string }
): Promise<number> => {
  const context = creationContext([params.dnaCode]);
  await enterViaHudaCta(page);
  await selectTransformationType(
    page,
    TransformationType.TRANSFO_HUDA_VERS_CADA_NOUVEAU_MEME_OPERATEUR
  );
  await selectSources(page, { structureIds: params.hudaSourceIds });
  await submitSelection(page);
  const transformationId = await captureTransformationId(page);

  // N fermetures (1 étape chacune) + une brique création (3 étapes).
  const steps = emptySteps(params.hudaSourceIds.length + STEPS_PER_BRIQUE);
  await walkSteps(page, context, steps);
  await finishFlow(page, transformationId);
  return transformationId;
};

/** HUDA → CADA existant (N fermetures + extension, héritage opérateur). */
export const runHudaToExistingCada = async (
  page: Page,
  params: { hudaSourceIds: number[]; cadaTargetId: number }
): Promise<number> => {
  await enterViaHudaCta(page);
  await selectTransformationType(
    page,
    TransformationType.TRANSFO_HUDA_VERS_CADA_EXISTANT_MEME_OPERATEUR
  );
  await selectSources(page, { structureIds: params.hudaSourceIds });
  await pickStructures(page, [params.cadaTargetId]);
  await submitSelection(page);
  const transformationId = await captureTransformationId(page);

  // N fermetures (1 étape chacune) + une brique extension (3 étapes).
  const steps = emptySteps(params.hudaSourceIds.length + STEPS_PER_BRIQUE);
  await walkSteps(page, EMPTY_CONTEXT, steps);
  await finishFlow(page, transformationId);
  return transformationId;
};
