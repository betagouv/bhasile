import { describe, expect, it } from "vitest";

import { applyPrefill } from "@/app/api/transformations/transformation.util";
import { StructureTransformationApiCreate } from "@/schemas/api/transformation.schema";
import {
  StructureTransformationType,
  TransformationType,
} from "@/types/transformation.type";

describe("applyPrefill", () => {
  it("adds FERMETURE contacts/antennes/adresses to the CREATION (OUVERTURE_DEPUIS)", () => {
    const structureTransformations: StructureTransformationApiCreate[] = [
      {
        type: StructureTransformationType.FERMETURE,
        structureVersion: {
          contacts: [{ prenom: "Nicolas", nom: "Leboeuf" }],
          antennes: [{ name: "Avranches Nord" }],
          adresses: [{ adresse: "1 rue A", adresseTypologies: [] }],
        },
      },
      {
        type: StructureTransformationType.FERMETURE,
        structureVersion: {
          contacts: [{ prenom: "Chloé", nom: "Pouillevet" }],
          antennes: [{ name: "Avranches Sud" }],
          adresses: [{ adresse: "2 rue B", adresseTypologies: [] }],
        },
      },
      { type: StructureTransformationType.CREATION },
    ];

    const result = applyPrefill(
      TransformationType.OUVERTURE_DEPUIS_UNE_OU_PLUSIEURS_STRUCTURES,
      structureTransformations
    );

    const creation = result.find(
      (structureTransformation) =>
        structureTransformation.type === StructureTransformationType.CREATION
    );
    expect(creation?.structureVersion?.contacts).toHaveLength(2);
    expect(creation?.structureVersion?.antennes).toHaveLength(2);
    expect(creation?.structureVersion?.adresses).toHaveLength(2);

    // Les sources (FERMETURE) ne sont pas modifiées.
    const fermetures = result.filter(
      (structureTransformation) =>
        structureTransformation.type === StructureTransformationType.FERMETURE
    );
    expect(fermetures[0].structureVersion?.contacts).toHaveLength(1);
  });

  it("keeps the target's own data and appends the sources (additive)", () => {
    const structureTransformations: StructureTransformationApiCreate[] = [
      {
        type: StructureTransformationType.FERMETURE,
        structureVersion: {
          contacts: [{ prenom: "Chloé", nom: "Pouillevet" }],
        },
      },
      {
        type: StructureTransformationType.CREATION,
        structureVersion: {
          contacts: [{ prenom: "Existant", nom: "Cible" }],
        },
      },
    ];

    const result = applyPrefill(
      TransformationType.OUVERTURE_DEPUIS_UNE_OU_PLUSIEURS_STRUCTURES,
      structureTransformations
    );

    const creation = result.find(
      (structureTransformation) =>
        structureTransformation.type === StructureTransformationType.CREATION
    );
    expect(creation?.structureVersion?.contacts).toEqual([
      { prenom: "Existant", nom: "Cible" },
      { prenom: "Chloé", nom: "Pouillevet" },
    ]);
  });

  it("returns the structureTransformations unchanged when the type has no prefill config", () => {
    const structureTransformations: StructureTransformationApiCreate[] = [
      {
        type: StructureTransformationType.CREATION,
        structureVersion: { contacts: [{ prenom: "Solo", nom: "Test" }] },
      },
    ];

    const result = applyPrefill(
      TransformationType.OUVERTURE_EX_NIHILO,
      structureTransformations
    );

    expect(result).toBe(structureTransformations);
  });
});
