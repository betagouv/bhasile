import { describe, expect, it } from "vitest";

import { AdditionalFieldsType } from "@/config/acte-administratif.config";
import { getTransformationActesAdministratifsCategoryToDisplay } from "@/config/transformation.config";
import {
  StructureVersionTransformationType,
  TransformationType,
} from "@/types/transformation.type";

describe("getTransformationActesAdministratifsCategoryToDisplay", () => {
  it("renvoie les catégories d'extension (Convention, Arrêté d'extension à date unique, Autres)", () => {
    const rules = getTransformationActesAdministratifsCategoryToDisplay(
      StructureVersionTransformationType.EXTENSION,
      undefined
    );

    expect(Object.keys(rules)).toEqual([
      "CONVENTION",
      "ARRETE_EXTENSION",
      "AUTRE",
    ]);
    expect(rules.CONVENTION?.additionalFieldsType).toBe(
      AdditionalFieldsType.DATE_START_END
    );
    expect(rules.ARRETE_EXTENSION?.additionalFieldsType).toBe(
      AdditionalFieldsType.DATE
    );
    expect(rules.ARRETE_EXTENSION?.isOptional).toBe(false);
    expect(rules.AUTRE?.isOptional).toBe(true);
  });

  it("conserve l'alternative avenant de la convention pour une extension classique", () => {
    const rules = getTransformationActesAdministratifsCategoryToDisplay(
      StructureVersionTransformationType.EXTENSION,
      undefined
    );

    expect(rules.CONVENTION?.avenantAlternative?.parentCategory).toBe(
      "CONVENTION"
    );
    expect(rules.CONVENTION?.notice).toBeUndefined();
  });

  it("retire l'alternative avenant de la convention et ajoute une notice pour une transformation HUDA vers CADA existant", () => {
    const rules = getTransformationActesAdministratifsCategoryToDisplay(
      StructureVersionTransformationType.EXTENSION,
      TransformationType.TRANSFO_HUDA_VERS_CADA_EXISTANT_MEME_OPERATEUR
    );

    expect(rules.CONVENTION?.avenantAlternative).toBeUndefined();
    expect(rules.CONVENTION?.notice).toBe(
      "Une nouvelle convention doit être signée tel que publié par décret le 3 janvier 2026. Sa durée doit être équivalente au temps restant de la précédente convention."
    );
    expect(rules.ARRETE_EXTENSION?.avenantAlternative?.parentCategory).toBe(
      "ARRETE_AUTORISATION"
    );
    expect(rules.ARRETE_EXTENSION?.notice).toBe(
      "Pour rappel, les dates de l'arrêté d'autorisation n'ont pas vocation à changer pour cette transformation."
    );
  });

  it("renvoie les catégories de contraction (Convention, Arrêté actant la contraction à date unique, Autres)", () => {
    const rules = getTransformationActesAdministratifsCategoryToDisplay(
      StructureVersionTransformationType.CONTRACTION,
      undefined
    );

    expect(Object.keys(rules)).toEqual([
      "CONVENTION",
      "ARRETE_CONTRACTION",
      "AUTRE",
    ]);
    expect(rules.ARRETE_CONTRACTION?.additionalFieldsType).toBe(
      AdditionalFieldsType.DATE
    );
    expect(rules.ARRETE_CONTRACTION?.isOptional).toBe(false);
  });

  it("délègue aux catégories de création et adapte l'arrêté d'autorisation selon le type de démarche", () => {
    const exNihilo = getTransformationActesAdministratifsCategoryToDisplay(
      StructureVersionTransformationType.CREATION,
      TransformationType.OUVERTURE_EX_NIHILO
    );
    const depuisStructures =
      getTransformationActesAdministratifsCategoryToDisplay(
        StructureVersionTransformationType.CREATION,
        TransformationType.OUVERTURE_DEPUIS_UNE_OU_PLUSIEURS_STRUCTURES
      );

    expect(exNihilo.ARRETE_AUTORISATION?.title).toBe("Arrêté d'autorisation");
    expect(exNihilo.ARRETE_AUTORISATION?.alternativeCategories).toBeUndefined();
    expect(depuisStructures.ARRETE_AUTORISATION?.title).toBe(
      "Arrêté d'autorisation ou arrêté de fusion des structures"
    );
    expect(depuisStructures.ARRETE_AUTORISATION?.alternativeCategories).toEqual([
      "ARRETE_FUSION",
    ]);
  });

  it("renvoie les catégories de fermeture", () => {
    const rules = getTransformationActesAdministratifsCategoryToDisplay(
      StructureVersionTransformationType.FERMETURE,
      undefined
    );

    expect(Object.keys(rules)).toEqual(["AUTRE"]);
    expect(rules.AUTRE?.title).toBe("Arrêtés ou documents actant la fermeture");
  });
});
