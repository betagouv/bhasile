import { describe, expect, it } from "vitest";

import { applyPrefill } from "@/app/api/transformations/transformation.util";
import { StructureVersionTransformationApiCreate } from "@/schemas/api/transformation.schema";
import {
  StructureVersionTransformationType,
  TransformationType,
} from "@/types/transformation.type";

describe("applyPrefill", () => {
  it("ajoute les contacts/antennes/adresses des FERMETURE à la CREATION (OUVERTURE_DEPUIS)", () => {
    const structureVersionTransformations: StructureVersionTransformationApiCreate[] = [
      {
        type: StructureVersionTransformationType.FERMETURE,
        structureVersion: {
          contacts: [{ prenom: "Nicolas", nom: "Leboeuf" }],
          antennes: [{ name: "Avranches Nord" }],
          adresses: [{ adresse: "1 rue A", adresseTypologies: [] }],
        },
      },
      {
        type: StructureVersionTransformationType.FERMETURE,
        structureVersion: {
          contacts: [{ prenom: "Chloé", nom: "Pouillevet" }],
          antennes: [{ name: "Avranches Sud" }],
          adresses: [{ adresse: "2 rue B", adresseTypologies: [] }],
        },
      },
      { type: StructureVersionTransformationType.CREATION },
    ];

    const result = applyPrefill(
      TransformationType.OUVERTURE_DEPUIS_UNE_OU_PLUSIEURS_STRUCTURES,
      structureVersionTransformations
    );

    const creation = result.find(
      (structureVersionTransformation) =>
        structureVersionTransformation.type === StructureVersionTransformationType.CREATION
    );
    expect(creation?.structureVersion?.contacts).toHaveLength(2);
    expect(creation?.structureVersion?.antennes).toHaveLength(2);
    expect(creation?.structureVersion?.adresses).toHaveLength(2);

    // Les sources (FERMETURE) ne sont pas modifiées.
    const fermetures = result.filter(
      (structureVersionTransformation) =>
        structureVersionTransformation.type === StructureVersionTransformationType.FERMETURE
    );
    expect(fermetures[0].structureVersion?.contacts).toHaveLength(1);
  });

  it("conserve les données propres de la cible et ajoute celles des sources (additif)", () => {
    const structureVersionTransformations: StructureVersionTransformationApiCreate[] = [
      {
        type: StructureVersionTransformationType.FERMETURE,
        structureVersion: {
          contacts: [{ prenom: "Chloé", nom: "Pouillevet" }],
        },
      },
      {
        type: StructureVersionTransformationType.CREATION,
        structureVersion: {
          contacts: [{ prenom: "Existant", nom: "Cible" }],
        },
      },
    ];

    const result = applyPrefill(
      TransformationType.OUVERTURE_DEPUIS_UNE_OU_PLUSIEURS_STRUCTURES,
      structureVersionTransformations
    );

    const creation = result.find(
      (structureVersionTransformation) =>
        structureVersionTransformation.type === StructureVersionTransformationType.CREATION
    );
    expect(creation?.structureVersion?.contacts).toEqual([
      { prenom: "Existant", nom: "Cible" },
      { prenom: "Chloé", nom: "Pouillevet" },
    ]);
  });

  it("retourne les structureVersionTransformations inchangées quand le type n'a pas de config de préremplissage", () => {
    const structureVersionTransformations: StructureVersionTransformationApiCreate[] = [
      {
        type: StructureVersionTransformationType.CREATION,
        structureVersion: { contacts: [{ prenom: "Solo", nom: "Test" }] },
      },
    ];

    const result = applyPrefill(
      TransformationType.OUVERTURE_EX_NIHILO,
      structureVersionTransformations
    );

    expect(result).toBe(structureVersionTransformations);
  });
});
