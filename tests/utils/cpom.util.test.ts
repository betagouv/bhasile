import { describe, expect, it } from "vitest";

import { getCpomActesScopes, getCpomDefaultValues } from "@/app/utils/cpom.util";
import { CpomApiRead } from "@/schemas/api/cpom.schema";
import { StructureType } from "@/types/structure.type";

const makeCpom = (actesAdministratifs: unknown[]): CpomApiRead =>
  ({ id: 1, actesAdministratifs }) as unknown as CpomApiRead;

const makeCpomWithStructures = (
  actesAdministratifs: unknown[],
  structureTypes: StructureType[]
): CpomApiRead =>
  ({
    id: 1,
    actesAdministratifs,
    structures: structureTypes.map((structureType) => ({
      structure: { type: structureType },
    })),
  }) as unknown as CpomApiRead;

describe("getCpomDefaultValues", () => {
  it("ajoute la ligne de contrat quand le CPOM ne porte aucun acte", () => {
    const { actesAdministratifs } = getCpomDefaultValues(makeCpom([]));

    expect(actesAdministratifs).toHaveLength(1);
    expect(actesAdministratifs?.[0]?.category).toBe("CONVENTION_CPOM");
  });

  it("ajoute la ligne de contrat quand le CPOM ne porte que des actes scopés par type", () => {
    const { actesAdministratifs } = getCpomDefaultValues(
      makeCpom([
        {
          id: 10,
          category: "ARRETE_AUTORISATION",
          structureType: "CADA",
          parentId: null,
        },
      ])
    );

    expect(actesAdministratifs).toHaveLength(2);
    expect(
      actesAdministratifs?.some(
        (acteAdministratif) => acteAdministratif.category === "CONVENTION_CPOM"
      )
    ).toBe(true);
    expect(
      actesAdministratifs?.some(
        (acteAdministratif) =>
          acteAdministratif.category === "ARRETE_AUTORISATION"
      )
    ).toBe(true);
  });

  it("n'ajoute pas de ligne de contrat quand le contrat existe déjà", () => {
    const { actesAdministratifs } = getCpomDefaultValues(
      makeCpom([{ id: 5, category: "CONVENTION_CPOM", parentId: null }])
    );

    expect(actesAdministratifs).toHaveLength(1);
    expect(actesAdministratifs?.[0]?.id).toBe(5);
  });

  it("ajoute la ligne de contrat quand seul un avenant de contrat existe", () => {
    const { actesAdministratifs } = getCpomDefaultValues(
      makeCpom([{ id: 6, category: "CONVENTION_CPOM", parentId: 5 }])
    );

    expect(actesAdministratifs).toHaveLength(2);
  });
});

describe("getCpomActesScopes", () => {
  it("expose toujours le périmètre CPOM, même sans acte", () => {
    const scopes = getCpomActesScopes(makeCpom([]));

    expect(scopes).toHaveLength(1);
    expect(scopes[0]?.scope).toBe("CPOM");
    expect(scopes[0]?.actesAdministratifs).toHaveLength(0);
  });

  it("rattache un avenant au périmètre de son parent plutôt qu'au CPOM", () => {
    const scopes = getCpomActesScopes(
      makeCpom([
        {
          id: 10,
          category: "ARRETE_AUTORISATION",
          structureType: "CADA",
          parentId: null,
        },
        {
          id: 11,
          category: "ARRETE_AUTORISATION",
          structureType: null,
          parentId: 10,
        },
      ])
    );

    const cadaScope = scopes.find((scope) => scope.scope === "CADA");
    const cpomScope = scopes.find((scope) => scope.scope === "CPOM");

    expect(cadaScope?.actesAdministratifs.map((acte) => acte.id)).toEqual([
      10, 11,
    ]);
    expect(cpomScope?.actesAdministratifs).toHaveLength(0);
  });

  it("affiche un type porté par une structure du CPOM même sans acte", () => {
    const scopes = getCpomActesScopes(
      makeCpomWithStructures([], [StructureType.CPH])
    );

    expect(scopes.map((scope) => scope.scope)).toEqual(["CPOM", "CPH"]);
  });

  it("affiche un type porté par un acte même si aucune structure du CPOM n'a ce type", () => {
    const scopes = getCpomActesScopes(
      makeCpomWithStructures(
        [
          {
            id: 20,
            category: "CONVENTION",
            structureType: "HUDA",
            parentId: null,
          },
        ],
        [StructureType.CADA]
      )
    );

    expect(scopes.map((scope) => scope.scope)).toEqual([
      "CPOM",
      "CADA",
      "HUDA",
    ]);
  });

  it("trie les périmètres dans l'ordre d'affichage des types, CPOM en tête", () => {
    const scopes = getCpomActesScopes(
      makeCpomWithStructures(
        [],
        [StructureType.HUDA, StructureType.CPH, StructureType.CADA]
      )
    );

    expect(scopes.map((scope) => scope.scope)).toEqual([
      "CPOM",
      "CADA",
      "CPH",
      "HUDA",
    ]);
  });
});
