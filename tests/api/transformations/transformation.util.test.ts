import { describe, expect, it } from "vitest";

import {
  applyPrefill,
  checkNoDuplicateStructureIds,
  checkUniqueDepartement,
} from "@/app/api/transformations/transformation.util";
import { ApiDomainError } from "@/app/utils/apiDomainError.util";
import { StructureVersionTransformationApiCreate } from "@/schemas/api/transformation.schema";
import {
  StructureVersionTransformationType,
  TransformationType,
} from "@/types/transformation.type";

describe("applyPrefill", () => {
  it("ajoute les contacts/antennes/adresses des FERMETURE à la CREATION (OUVERTURE_DEPUIS)", () => {
    const structureVersionTransformations: StructureVersionTransformationApiCreate[] =
      [
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
        structureVersionTransformation.type ===
        StructureVersionTransformationType.CREATION
    );
    expect(creation?.structureVersion?.contacts).toHaveLength(2);
    expect(creation?.structureVersion?.antennes).toHaveLength(2);
    expect(creation?.structureVersion?.adresses).toHaveLength(2);

    // Les sources (FERMETURE) ne sont pas modifiées.
    const fermetures = result.filter(
      (structureVersionTransformation) =>
        structureVersionTransformation.type ===
        StructureVersionTransformationType.FERMETURE
    );
    expect(fermetures[0].structureVersion?.contacts).toHaveLength(1);
  });

  it("hérite de l'operateur de la première source FERMETURE sur la CREATION", () => {
    const structureVersionTransformations: StructureVersionTransformationApiCreate[] =
      [
        {
          type: StructureVersionTransformationType.FERMETURE,
          operateurId: 42,
          structureVersion: {},
        },
        {
          type: StructureVersionTransformationType.FERMETURE,
          operateurId: 42,
          structureVersion: {},
        },
        { type: StructureVersionTransformationType.CREATION },
      ];

    const result = applyPrefill(
      TransformationType.OUVERTURE_DEPUIS_UNE_OU_PLUSIEURS_STRUCTURES,
      structureVersionTransformations
    );

    const creation = result.find(
      (structureVersionTransformation) =>
        structureVersionTransformation.type ===
        StructureVersionTransformationType.CREATION
    );
    expect(creation?.operateurId).toBe(42);
  });

  it("laisse l'operateur de la CREATION indéfini quand le type n'a pas de config de prefill", () => {
    const structureVersionTransformations: StructureVersionTransformationApiCreate[] =
      [{ type: StructureVersionTransformationType.CREATION }];

    const result = applyPrefill(
      TransformationType.OUVERTURE_EX_NIHILO,
      structureVersionTransformations
    );

    expect(result[0].operateurId).toBeUndefined();
  });

  it("conserve les données propres de la cible et ajoute les sources (additif)", () => {
    const structureVersionTransformations: StructureVersionTransformationApiCreate[] =
      [
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
        structureVersionTransformation.type ===
        StructureVersionTransformationType.CREATION
    );
    expect(creation?.structureVersion?.contacts).toEqual([
      { prenom: "Existant", nom: "Cible" },
      { prenom: "Chloé", nom: "Pouillevet" },
    ]);
  });

  it("retourne les structureVersionTransformations inchangées quand le type n'a pas de config de prefill", () => {
    const structureVersionTransformations: StructureVersionTransformationApiCreate[] =
      [
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

describe("checkNoDuplicateStructureIds", () => {
  it("rejette un structureId présent dans deux structureVersionTransformations", () => {
    const structureVersionTransformations: StructureVersionTransformationApiCreate[] =
      [
        {
          type: StructureVersionTransformationType.FERMETURE,
          structureVersion: { structureId: 1 },
        },
        {
          type: StructureVersionTransformationType.EXTENSION,
          structureVersion: { structureId: 1 },
        },
      ];

    expect(() =>
      checkNoDuplicateStructureIds(structureVersionTransformations)
    ).toThrow(ApiDomainError);
    expect(() =>
      checkNoDuplicateStructureIds(structureVersionTransformations)
    ).toThrow(
      "Une structure ne peut pas à la fois céder et recevoir des places dans une même transformation."
    );
  });

  it("laisse passer des structureId distincts", () => {
    const structureVersionTransformations: StructureVersionTransformationApiCreate[] =
      [
        {
          type: StructureVersionTransformationType.FERMETURE,
          structureVersion: { structureId: 1 },
        },
        {
          type: StructureVersionTransformationType.EXTENSION,
          structureVersion: { structureId: 2 },
        },
      ];

    expect(() =>
      checkNoDuplicateStructureIds(structureVersionTransformations)
    ).not.toThrow();
  });

  it("ignore les structureVersionTransformations sans structureId", () => {
    const structureVersionTransformations: StructureVersionTransformationApiCreate[] =
      [
        { type: StructureVersionTransformationType.CREATION },
        { type: StructureVersionTransformationType.CREATION },
      ];

    expect(() =>
      checkNoDuplicateStructureIds(structureVersionTransformations)
    ).not.toThrow();
  });
});

describe("checkUniqueDepartement", () => {
  it("rejette une sélection mêlant deux départements", () => {
    const structureVersionTransformations: StructureVersionTransformationApiCreate[] =
      [
        {
          type: StructureVersionTransformationType.CONTRACTION,
          structureVersion: { departementAdministratif: "75" },
        },
        {
          type: StructureVersionTransformationType.EXTENSION,
          structureVersion: { departementAdministratif: "92" },
        },
      ];

    expect(() =>
      checkUniqueDepartement(structureVersionTransformations)
    ).toThrow(ApiDomainError);
    expect(() =>
      checkUniqueDepartement(structureVersionTransformations)
    ).toThrow(
      "Toutes les structures d'une transformation doivent appartenir au même département."
    );
  });

  it("laisse passer des structures du même département", () => {
    const structureVersionTransformations: StructureVersionTransformationApiCreate[] =
      [
        {
          type: StructureVersionTransformationType.CONTRACTION,
          structureVersion: { departementAdministratif: "75" },
        },
        {
          type: StructureVersionTransformationType.EXTENSION,
          structureVersion: { departementAdministratif: "75" },
        },
      ];

    expect(() =>
      checkUniqueDepartement(structureVersionTransformations)
    ).not.toThrow();
  });

  it("ignore les blocs de création sans département", () => {
    const structureVersionTransformations: StructureVersionTransformationApiCreate[] =
      [
        {
          type: StructureVersionTransformationType.FERMETURE,
          structureVersion: { departementAdministratif: "75" },
        },
        { type: StructureVersionTransformationType.CREATION },
      ];

    expect(() =>
      checkUniqueDepartement(structureVersionTransformations)
    ).not.toThrow();
  });
});
