import { describe, expect, it } from "vitest";

import { AdditionalFieldsType } from "@/config/acte-administratif.config";
import {
  getTransformationActesAdministratifsCategoryToDisplay,
  TRANSFORMATION_TYPE_SPECS,
} from "@/config/transformation.config";
import { StructureType } from "@/types/structure.type";
import {
  HudaCadaDestination,
  StructureVersionTransformationType,
  TransformationFormType,
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
      TransformationType.TRANSFO_HUDA_FERMETURE_VERS_CADA_EXISTANT
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
    expect(depuisStructures.ARRETE_AUTORISATION?.alternativeCategories).toEqual(
      ["ARRETE_FUSION"]
    );
  });

  it("applique la notice du décret quel que soit le mode de départ des HUDA", () => {
    const depuisFermeture =
      getTransformationActesAdministratifsCategoryToDisplay(
        StructureVersionTransformationType.EXTENSION,
        TransformationType.TRANSFO_HUDA_FERMETURE_VERS_CADA_EXISTANT
      );
    const depuisContraction =
      getTransformationActesAdministratifsCategoryToDisplay(
        StructureVersionTransformationType.EXTENSION,
        TransformationType.TRANSFO_HUDA_CONTRACTION_VERS_CADA_EXISTANT
      );

    expect(depuisContraction.CONVENTION?.notice).toBe(
      depuisFermeture.CONVENTION?.notice
    );
    expect(depuisContraction.CONVENTION?.avenantAlternative).toBeUndefined();
  });

  it("n'offre pas l'arrêté de fusion à un nouveau CADA issu de HUDA qui contractent", () => {
    const rules = getTransformationActesAdministratifsCategoryToDisplay(
      StructureVersionTransformationType.CREATION,
      TransformationType.TRANSFO_HUDA_CONTRACTION_VERS_CADA_NOUVEAU
    );

    expect(rules.ARRETE_AUTORISATION?.title).toBe("Arrêté d'autorisation");
    expect(rules.ARRETE_AUTORISATION?.alternativeCategories).toBeUndefined();
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

describe("TRANSFORMATION_TYPE_SPECS — grille HUDA vers CADA", () => {
  const HUDA_CADA_GRID = [
    {
      type: TransformationType.TRANSFO_HUDA_FERMETURE_VERS_CADA_EXISTANT,
      departureType: StructureVersionTransformationType.FERMETURE,
      destination: HudaCadaDestination.CADA_EXISTANT,
    },
    {
      type: TransformationType.TRANSFO_HUDA_FERMETURE_VERS_CADA_NOUVEAU,
      departureType: StructureVersionTransformationType.FERMETURE,
      destination: HudaCadaDestination.CADA_NOUVEAU,
    },
    {
      type: TransformationType.TRANSFO_HUDA_FERMETURE_REMISE_EN_CONCURRENCE,
      departureType: StructureVersionTransformationType.FERMETURE,
      destination: HudaCadaDestination.REMISE_EN_CONCURRENCE,
    },
    {
      type: TransformationType.TRANSFO_HUDA_CONTRACTION_VERS_CADA_EXISTANT,
      departureType: StructureVersionTransformationType.CONTRACTION,
      destination: HudaCadaDestination.CADA_EXISTANT,
    },
    {
      type: TransformationType.TRANSFO_HUDA_CONTRACTION_VERS_CADA_NOUVEAU,
      departureType: StructureVersionTransformationType.CONTRACTION,
      destination: HudaCadaDestination.CADA_NOUVEAU,
    },
    {
      type: TransformationType.TRANSFO_HUDA_CONTRACTION_REMISE_EN_CONCURRENCE,
      departureType: StructureVersionTransformationType.CONTRACTION,
      destination: HudaCadaDestination.REMISE_EN_CONCURRENCE,
    },
  ];

  it.each(HUDA_CADA_GRID)(
    "expose $type comme parcours HUDA dont le bloc de départ est $departureType",
    ({ type, departureType, destination }) => {
      const spec = TRANSFORMATION_TYPE_SPECS[type];

      expect(spec.formType).toBe(TransformationFormType.HUDA);
      expect(spec.hudaCadaDestination).toBe(destination);
      expect(spec.blocks[0]).toMatchObject({
        id: "huda",
        multiple: true,
        type: departureType,
        fixedType: StructureType.HUDA,
      });
    }
  );

  it.each(
    HUDA_CADA_GRID.filter(
      ({ destination }) => destination === HudaCadaDestination.CADA_EXISTANT
    )
  )(
    "laisse $type viser plusieurs CADA existants, sans création automatique",
    ({ type, departureType }) => {
      const spec = TRANSFORMATION_TYPE_SPECS[type];

      expect(spec.blocks[1]).toMatchObject({
        id: "cada",
        multiple: true,
        type: StructureVersionTransformationType.EXTENSION,
        fixedType: StructureType.CADA,
        inheritOperateurFrom: "huda",
        inheritDepartementFrom: "huda",
      });
      expect(spec.buildAutoTransformations()).toEqual([]);
      expect(spec.prefill).toEqual([
        {
          from: departureType,
          to: StructureVersionTransformationType.EXTENSION,
          fields: ["contacts", "antennes", "adresses"],
        },
      ]);
    }
  );

  it.each(
    HUDA_CADA_GRID.filter(
      ({ destination }) => destination === HudaCadaDestination.CADA_NOUVEAU
    )
  )("crée un seul CADA pour $type et lui transmet l'opérateur", ({ type }) => {
    const spec = TRANSFORMATION_TYPE_SPECS[type];

    expect(spec.blocks).toHaveLength(1);
    expect(spec.buildAutoTransformations()).toEqual([
      {
        type: StructureVersionTransformationType.CREATION,
        structureType: StructureType.CADA,
      },
    ]);
    expect(spec.prefill?.[0].fields).toContain("operateur");
  });

  it.each(
    HUDA_CADA_GRID.filter(
      ({ destination }) =>
        destination === HudaCadaDestination.REMISE_EN_CONCURRENCE
    )
  )("laisse $type sans destinataire ni pré-remplissage", ({ type }) => {
    const spec = TRANSFORMATION_TYPE_SPECS[type];

    expect(spec.blocks).toHaveLength(1);
    expect(spec.buildAutoTransformations()).toEqual([]);
    expect(spec.prefill).toBeUndefined();
  });
});
