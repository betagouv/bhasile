import {
  StructureVersionTransformationType,
  TransformationType,
} from "@/types/transformation.type";

import { expect, test } from "../fixtures/test";
import { mockBanApi } from "../pages/shared/ban-mock.helper";
import {
  runCreationExNihilo,
  runExtensionFromContractions,
  runFermetureSeche,
  runHudaToExistingCada,
  runHudaToNewCada,
} from "../pages/transformation/flows/transformation-flows";
import { fetchTransformationGraph } from "../seed/transformation-assert";

// WIP — flux 2 vert. Les flux marqués `` butent sur 3 blocages
// d'interaction de formulaire à finaliser avec observation navigateur :
//  1. operateur.id en création (OperateurAutocompleteRhf) : l'autocomplete
//     remplit le nom mais pas l'id → "Ce champ est requis" (flux 1, 4).
//  2. select#type contrôlé : selectOption ne propage pas l'onChange → filtre
//     type vide → liste de sélection vide (flux 3).
//  3. une étape du walk n'atteint pas VALIDE (identification existante/places) :
//     flux 5 atteint la vérification mais finalisation bloquée (flux 3, 5).
test.describe("Transformations — flux finalisés", () => {
  test.beforeEach(async ({ page }) => {
    // Les flux multi-briques (saisie + walk de plusieurs étapes) dépassent le
    // timeout par défaut de 30s.
    test.setTimeout(120_000);
    await mockBanApi(page);
  });

  test("flux 2 — fermeture sèche", async ({
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
  });

  // TODO(blocages 2 & 3) : select#type contrôlé + validation d'un step.
  test.fixme("flux 3 — extension depuis structures qui contractent", async ({
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
    expect(
      extension?.structureVersion?.structureTypologies[0]?.placesAutorisees
    ).toBe(20);
    expect(
      contraction?.structureVersion?.structureTypologies[0]?.placesAutorisees
    ).toBe(5);
  });

  // TODO(blocage 3) : un step n'atteint pas VALIDE (sélection OK, va jusqu'à la vérif).
  test.fixme("flux 5 — HUDA vers CADA existant", async ({
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
  });

  // Flux créant une structure (bloc CREATION → getNextBhasileCode) : sérialisés
  // entre eux pour éviter la collision sur le compteur de code région.
  test.describe.serial("flux créateurs de structure", () => {
    // TODO(blocage 1) : operateur.id non renseigné par l'autocomplete RHF.
    test.fixme("flux 1 — création ex-nihilo", async ({
      page,
      knownDnaCode,
      registerTransformation,
    }) => {
      const transformationId = await runCreationExNihilo(page, {
        dnaCode: knownDnaCode,
      });
      registerTransformation(transformationId);

      const transformation = await fetchTransformationGraph(transformationId);
      expect(transformation.type).toBe(TransformationType.OUVERTURE_EX_NIHILO);
      expect(transformation.form?.status).toBe(true);
      expect(transformation.structureVersionTransformations).toHaveLength(1);

      const creation = transformation.structureVersionTransformations[0];
      expect(creation.type).toBe(StructureVersionTransformationType.CREATION);
      expect(creation.form?.status).toBe(true);
      expect(creation.structureVersion?.structure?.codeBhasile).toBeTruthy();
      expect(creation.structureVersion?.nom).toContain("E2E-");

      // Persistance des champs optionnels (matrice de couverture).
      expect(creation.structureVersion?.antennes.length).toBeGreaterThanOrEqual(
        2
      );
      expect(creation.structureVersion?.contacts.length).toBeGreaterThanOrEqual(
        2
      );
      expect(creation.structureVersion?.finesses.length).toBeGreaterThanOrEqual(
        1
      );
      expect(
        creation.structureVersion?.dnaStructures.length
      ).toBeGreaterThanOrEqual(2);
    });

    // TODO(blocage 1) : operateur.id non renseigné (bloc création).
    test.fixme("flux 4 — HUDA vers nouveau CADA", async ({
      page,
      hudaSources,
      knownDnaCode,
      registerTransformation,
    }) => {
      const transformationId = await runHudaToNewCada(page, {
        hudaSourceIds: hudaSources.map((source) => source.id),
        dnaCode: knownDnaCode,
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
      expect(
        creations[0]?.structureVersion?.structure?.codeBhasile
      ).toBeTruthy();
    });
  });
});
