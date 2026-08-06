import { describe, expect, it } from "vitest";

import {
  applyPrefill,
  checkCanUpdateDepartements,
  checkEffectiveDatesAreValid,
  checkNoDuplicateStructureIds,
  checkUniqueDepartement,
} from "@/app/api/transformations/transformation.util";
import { ApiDomainError } from "@/app/utils/apiDomainError.util";
import { StructureVersionTransformationApiCreate } from "@/schemas/api/transformation.schema";
import { SessionUser } from "@/types/global";
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
            adresses: [{ adresse: "1 rue A" }],
          },
        },
        {
          type: StructureVersionTransformationType.FERMETURE,
          structureVersion: {
            contacts: [{ prenom: "Chloé", nom: "Pouillevet" }],
            antennes: [{ name: "Avranches Sud" }],
            adresses: [{ adresse: "2 rue B" }],
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

  it("traite une chaîne vide comme une absence de département", () => {
    const structureVersionTransformations: StructureVersionTransformationApiCreate[] =
      [
        {
          type: StructureVersionTransformationType.FERMETURE,
          structureVersion: { departementAdministratif: "75" },
        },
        {
          type: StructureVersionTransformationType.CREATION,
          structureVersion: { departementAdministratif: "" },
        },
      ];

    expect(() =>
      checkUniqueDepartement(structureVersionTransformations)
    ).not.toThrow();
  });
});

describe("checkCanUpdateDepartements", () => {
  const agentParis = {
    role: "DEPARTEMENT_PARIS",
    allowedDepartements: ["75"],
  } as unknown as SessionUser;

  const agentNational = {
    role: "NATIONAL",
    allowedDepartements: [],
  } as unknown as SessionUser;

  const buildStructureVersionTransformation = (
    departementAdministratif: string
  ) => ({ structureVersion: { departementAdministratif } });

  it("laisse passer un département du périmètre de l'agent", () => {
    expect(() =>
      checkCanUpdateDepartements(agentParis, [
        buildStructureVersionTransformation("75"),
      ])
    ).not.toThrow();
  });

  it("rejette un département hors du périmètre de l'agent", () => {
    expect(() =>
      checkCanUpdateDepartements(agentParis, [
        buildStructureVersionTransformation("92"),
      ])
    ).toThrow("Le département 92 n'est pas dans votre périmètre.");
  });

  it("rejette dès qu'un seul des départements est hors périmètre", () => {
    expect(() =>
      checkCanUpdateDepartements(agentParis, [
        buildStructureVersionTransformation("75"),
        buildStructureVersionTransformation("92"),
      ])
    ).toThrow("Le département 92 n'est pas dans votre périmètre.");
  });

  it("rejette un département hérité de la structure source", () => {
    expect(() =>
      checkCanUpdateDepartements(agentParis, [
        { structureVersion: { structure: { departementAdministratif: "92" } } },
      ])
    ).toThrow(ApiDomainError);
  });

  it("laisse un agent démarrer une création dont le département est encore inconnu", () => {
    expect(() => checkCanUpdateDepartements(agentParis, [{}])).not.toThrow();
  });

  it("ignore une chaîne vide plutôt que de la comparer au périmètre", () => {
    expect(() =>
      checkCanUpdateDepartements(agentParis, [
        buildStructureVersionTransformation(""),
      ])
    ).not.toThrow();
  });

  it("refuse un utilisateur sans droit d'écriture quand le département est inconnu", () => {
    const operateur = {
      role: "ANONYMOUS",
      allowedDepartements: [],
    } as unknown as SessionUser;

    expect(() => checkCanUpdateDepartements(operateur, [{}])).toThrow(
      "Droits insuffisants"
    );
  });

  it("laisse passer un agent national sur n'importe quel département", () => {
    expect(() =>
      checkCanUpdateDepartements(agentNational, [
        buildStructureVersionTransformation("92"),
      ])
    ).not.toThrow();
  });

  it("ne rejette rien sans utilisateur, pour les scripts", () => {
    expect(() =>
      checkCanUpdateDepartements(undefined, [
        buildStructureVersionTransformation("92"),
      ])
    ).not.toThrow();
  });
});

describe("checkEffectiveDatesAreValid", () => {
  it("rejette une date d'effet antérieure au seuil de versionnement", () => {
    const structureVersionTransformations: StructureVersionTransformationApiCreate[] =
      [
        {
          type: StructureVersionTransformationType.EXTENSION,
          structureVersion: { effectiveDate: "2025-12-31T12:00:00.000Z" },
        },
      ];

    expect(() =>
      checkEffectiveDatesAreValid(structureVersionTransformations)
    ).toThrow(ApiDomainError);
    expect(() =>
      checkEffectiveDatesAreValid(structureVersionTransformations)
    ).toThrow(
      "Il n'est pas possible de déclarer une date d'effet antérieure à 2026 sur Bhasile"
    );
  });

  it("rejette dès qu'un seul bloc porte une date antérieure au seuil", () => {
    const structureVersionTransformations: StructureVersionTransformationApiCreate[] =
      [
        {
          type: StructureVersionTransformationType.CREATION,
          structureVersion: { effectiveDate: "2026-03-01T12:00:00.000Z" },
        },
        {
          type: StructureVersionTransformationType.FERMETURE,
          structureVersion: { effectiveDate: "2024-06-01T12:00:00.000Z" },
        },
      ];

    expect(() =>
      checkEffectiveDatesAreValid(structureVersionTransformations)
    ).toThrow(ApiDomainError);
  });

  it("laisse passer une date d'effet au seuil", () => {
    const structureVersionTransformations: StructureVersionTransformationApiCreate[] =
      [
        {
          type: StructureVersionTransformationType.EXTENSION,
          structureVersion: { effectiveDate: "2026-01-01T12:00:00.000Z" },
        },
      ];

    expect(() =>
      checkEffectiveDatesAreValid(structureVersionTransformations)
    ).not.toThrow();
  });

  it("ignore les blocs sans date d'effet", () => {
    const structureVersionTransformations: StructureVersionTransformationApiCreate[] =
      [
        { type: StructureVersionTransformationType.CREATION },
        {
          type: StructureVersionTransformationType.FERMETURE,
          structureVersion: { effectiveDate: null },
        },
      ];

    expect(() =>
      checkEffectiveDatesAreValid(structureVersionTransformations)
    ).not.toThrow();
  });
});
