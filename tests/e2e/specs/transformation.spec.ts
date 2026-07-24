import { StructureType } from "@/types/structure.type";
import {
  StructureVersionTransformationType,
  TransformationType,
} from "@/types/transformation.type";

import { TRANSFORMATION_TEST_VALUES } from "../data/transformation.factory";
import { expect, test } from "../fixtures/test";
import { PARIS_ADDRESS } from "../pages/shared/address.helper";
import { mockBanApi } from "../pages/shared/ban-mock.helper";
import {
  runCreationExNihilo,
  runExtensionFromContractions,
  runFermetureSeche,
  runHudaToExistingCada,
  runHudaToNewCada,
} from "../pages/transformation/flows/transformation-flows";
import {
  fetchTransformationGraph,
  type TransformationGraph,
} from "../seed/transformation-assert";

const EFFECTIVE_YEAR = Number(
  TRANSFORMATION_TEST_VALUES.effectiveDate.slice(0, 4)
);

type StructureVersionTransformationGraph =
  TransformationGraph["structureVersionTransformations"][number];

const getVersionPlacesAutorisees = (
  svt: StructureVersionTransformationGraph | undefined
): number | null | undefined => svt?.structureVersion?.placesAutorisees;

test.describe("Transformations — flux finalisés", () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(40000);
    await mockBanApi(page);
  });

  test("fermeture sèche", async ({
    page,
    closingStructure,
    registerTransformation,
  }) => {
    const transformationId = await runFermetureSeche(page, {
      sourceStructureId: closingStructure.id,
    });
    registerTransformation(transformationId);

    const transformation = await fetchTransformationGraph(transformationId);
    expect(transformation.type).toBe(
      TransformationType.FERMETURE_SANS_TRANSFERT
    );
    expect(transformation.form?.status).toBe(true);
    expect(transformation.structureVersionTransformations).toHaveLength(1);

    const fermeture = transformation.structureVersionTransformations[0];
    expect(fermeture.type).toBe(StructureVersionTransformationType.FERMETURE);
    expect(fermeture.form?.status).toBe(true);
    expect(fermeture.structureVersion?.structureId).toBe(closingStructure.id);
    const fermetureDate = fermeture.structureVersion?.effectiveDate;
    expect(fermetureDate).toBeTruthy();
    expect(new Date(fermetureDate!).getUTCFullYear()).toBe(EFFECTIVE_YEAR);
  });

  test("extension depuis structures qui contractent", async ({
    page,
    extendedStructure,
    contractionSources,
    registerTransformation,
  }) => {
    const transformationId = await runExtensionFromContractions(page, {
      extendedStructureId: extendedStructure.id,
      contractionSourceIds: contractionSources.map((source) => source.id),
    });
    registerTransformation(transformationId);

    const transformation = await fetchTransformationGraph(transformationId);
    expect(transformation.type).toBe(
      TransformationType.EXTENSION_DEPUIS_STRUCTURES_QUI_CONTRACTENT
    );
    expect(transformation.form?.status).toBe(true);
    expect(
      transformation.structureVersionTransformations.every(
        (svt) => svt.form?.status === true
      )
    ).toBe(true);

    const extension = transformation.structureVersionTransformations.find(
      (svt) => svt.type === StructureVersionTransformationType.EXTENSION
    );
    const contraction = transformation.structureVersionTransformations.find(
      (svt) => svt.type === StructureVersionTransformationType.CONTRACTION
    );
    expect(extension).toBeDefined();
    expect(contraction).toBeDefined();
    expect(extension?.structureVersion?.structureId).toBe(extendedStructure.id);
    expect(contraction?.structureVersion?.structureId).toBe(
      contractionSources[0].id
    );
    expect(getVersionPlacesAutorisees(extension)).toBe(
      TRANSFORMATION_TEST_VALUES.extensionPlaces
    );
    expect(getVersionPlacesAutorisees(contraction)).toBe(
      TRANSFORMATION_TEST_VALUES.contractionPlaces
    );
  });

  test("HUDA vers CADA existant", async ({
    page,
    hudaSources,
    cadaTarget,
    registerTransformation,
  }) => {
    const transformationId = await runHudaToExistingCada(page, {
      hudaSourceIds: hudaSources.map((source) => source.id),
      cadaTargetId: cadaTarget.id,
    });
    registerTransformation(transformationId);

    const transformation = await fetchTransformationGraph(transformationId);
    expect(transformation.type).toBe(
      TransformationType.TRANSFO_HUDA_VERS_CADA_EXISTANT_MEME_OPERATEUR
    );
    expect(transformation.form?.status).toBe(true);

    const fermetures = transformation.structureVersionTransformations.filter(
      (svt) => svt.type === StructureVersionTransformationType.FERMETURE
    );
    const extensions = transformation.structureVersionTransformations.filter(
      (svt) => svt.type === StructureVersionTransformationType.EXTENSION
    );
    expect(fermetures).toHaveLength(hudaSources.length);
    expect(extensions).toHaveLength(1);
    expect(extensions[0]?.structureVersion?.structureId).toBe(cadaTarget.id);
    expect(getVersionPlacesAutorisees(extensions[0])).toBe(
      TRANSFORMATION_TEST_VALUES.extensionPlaces
    );
  });

  // Flux créant une structure (bloc CREATION → getNextBhasileCode) : sérialisés
  // entre eux pour éviter la collision sur le compteur de code région.
  test.describe.serial("flux créateurs de structure", () => {
    test("création ex-nihilo", async ({
      page,
      knownDnaCodes,
      registerTransformation,
    }) => {
      const transformationId = await runCreationExNihilo(page, {
        dnaCodes: knownDnaCodes,
      });
      registerTransformation(transformationId);

      const transformation = await fetchTransformationGraph(transformationId);
      expect(transformation.type).toBe(TransformationType.OUVERTURE_EX_NIHILO);
      expect(transformation.form?.status).toBe(true);
      expect(transformation.structureVersionTransformations).toHaveLength(1);

      const creation = transformation.structureVersionTransformations[0];
      expect(creation.type).toBe(StructureVersionTransformationType.CREATION);
      expect(creation.form?.status).toBe(true);

      const version = creation.structureVersion;
      expect(version?.structure?.codeBhasile).toBeTruthy();
      expect(version?.nom).toContain("E2E-");
      expect(creation.structureType).toBe(StructureType.CADA);
      expect(version?.public).toBeTruthy();
      expect(version?.adresseAdministrative).toBe(PARIS_ADDRESS.adresse);
      expect(version?.communeAdministrative).toBe(PARIS_ADDRESS.commune);
      expect(getVersionPlacesAutorisees(creation)).toBe(
        TRANSFORMATION_TEST_VALUES.creationPlaces
      );

      const antenneNames = version?.antennes.map((antenne) => antenne.name);
      expect(antenneNames).toContain("Site A");
      expect(antenneNames).toContain("Site B");
      expect(
        version?.contacts.some(
          (contact) => contact.email === "contact0@example.fr"
        )
      ).toBe(true);
      const dnaCodes = version?.dnaStructures.map(
        (dnaStructure) => dnaStructure.dna.code
      );
      expect(dnaCodes).toContain(knownDnaCodes[0]);
      expect(dnaCodes).toContain(knownDnaCodes[1]);
      expect(
        version?.structureFinesses.some((structureFiness) =>
          structureFiness.finess.code?.startsWith("E2E-FIN-")
        )
      ).toBe(true);
    });

    test("HUDA vers nouveau CADA", async ({
      page,
      hudaSources,
      knownDnaCodes,
      registerTransformation,
    }) => {
      const transformationId = await runHudaToNewCada(page, {
        hudaSourceIds: hudaSources.map((source) => source.id),
        dnaCode: knownDnaCodes[0],
      });
      registerTransformation(transformationId);

      const transformation = await fetchTransformationGraph(transformationId);
      expect(transformation.type).toBe(
        TransformationType.TRANSFO_HUDA_VERS_CADA_NOUVEAU_MEME_OPERATEUR
      );
      expect(transformation.form?.status).toBe(true);

      const fermetures = transformation.structureVersionTransformations.filter(
        (svt) => svt.type === StructureVersionTransformationType.FERMETURE
      );
      const creations = transformation.structureVersionTransformations.filter(
        (svt) => svt.type === StructureVersionTransformationType.CREATION
      );
      expect(fermetures).toHaveLength(hudaSources.length);
      expect(creations).toHaveLength(1);

      const creationVersion = creations[0]?.structureVersion;
      expect(creationVersion?.structure?.codeBhasile).toBeTruthy();
      expect(creationVersion?.nom).toContain("E2E-");
      expect(creations[0]?.structureType).toBe(StructureType.CADA);
      expect(getVersionPlacesAutorisees(creations[0])).toBe(
        TRANSFORMATION_TEST_VALUES.creationPlaces
      );
    });
  });
});
