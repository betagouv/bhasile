import { describe, expect, it } from "vitest";

import {
  getActesAdministratifsDefaultValues,
  getCategoryGroup,
  getCurrentStructureParentActe,
  resolveAvenantParentIds,
} from "@/app/utils/acteAdministratif.util";
import {
  AdditionalFieldsType,
  CategoryDisplayRule,
  CategoryDisplayRules,
} from "@/config/acte-administratif.config";
import { StructureParentActe } from "@/types/acte-administratif.type";

const REFERENCE_DATE = new Date("2025-06-01T12:00:00.000Z");

const parentActe = (
  overrides: Partial<StructureParentActe> = {}
): StructureParentActe => ({
  id: 1,
  category: "ARRETE_AUTORISATION",
  startDate: "2020-01-01T12:00:00.000Z",
  endDate: "2030-01-01T12:00:00.000Z",
  children: [],
  ...overrides,
});

const arreteExtensionRule: CategoryDisplayRule = {
  categoryShortName: "arrêté",
  title: "Arrêté d'extension",
  canAddFile: false,
  canAddAvenant: false,
  isOptional: false,
  shouldShow: true,
  additionalFieldsType: AdditionalFieldsType.DATE,
  documentLabel: "Document",
  addFileButtonLabel: "Ajouter un arrêté d'extension",
  avenantAlternative: {
    parentCategory: "ARRETE_AUTORISATION",
    avenantLabel: "Avenant arrêté d'autorisation",
  },
};

describe("getCategoryGroup", () => {
  it("inclut la catégorie parente de l'avenant et déduplique", () => {
    expect(
      getCategoryGroup("ARRETE_EXTENSION", undefined, "ARRETE_AUTORISATION")
    ).toEqual(["ARRETE_EXTENSION", "ARRETE_AUTORISATION"]);
  });

  it("ne duplique pas quand la catégorie parente est égale à la catégorie du bloc", () => {
    expect(getCategoryGroup("CONVENTION", undefined, "CONVENTION")).toEqual([
      "CONVENTION",
    ]);
  });
});

describe("getCurrentStructureParentActe", () => {
  it("retourne l'acte parent en vigueur à la date de référence, avec ses années de début et de fin", () => {
    const resolved = getCurrentStructureParentActe(
      [
        parentActe({ id: 7, category: "ARRETE_AUTORISATION" }),
        parentActe({ id: 8, category: "CONVENTION" }),
      ],
      "ARRETE_AUTORISATION",
      REFERENCE_DATE
    );
    expect(resolved).toEqual({ id: 7, startYear: 2020, endYear: 2030 });
  });

  it("choisit le plus récent (startDate la plus tardive) quand plusieurs actes sont en vigueur en même temps", () => {
    // Two ARRETE_AUTORISATION both span the reference date (e.g. a renewal entered before
    // the previous one expired). The later-starting one must win, regardless of array order.
    const resolved = getCurrentStructureParentActe(
      [
        parentActe({
          id: 1,
          startDate: "2018-01-01T12:00:00.000Z",
          endDate: "2030-01-01T12:00:00.000Z",
        }),
        parentActe({
          id: 2,
          startDate: "2023-01-01T12:00:00.000Z",
          endDate: "2032-01-01T12:00:00.000Z",
        }),
      ],
      "ARRETE_AUTORISATION",
      REFERENCE_DATE
    );
    expect(resolved).toEqual({ id: 2, startYear: 2023, endYear: 2032 });
  });

  it("utilise l'endDate d'avenant la plus lointaine comme fin effective (max children ?? parent)", () => {
    const resolved = getCurrentStructureParentActe(
      [
        parentActe({
          id: 7,
          endDate: "2030-01-01T12:00:00.000Z",
          children: [
            { endDate: "2028-01-01T12:00:00.000Z" },
            { endDate: "2035-01-01T12:00:00.000Z" },
          ],
        }),
      ],
      "ARRETE_AUTORISATION",
      REFERENCE_DATE
    );
    expect(resolved?.endYear).toBe(2035);
  });

  it("considère un acte comme courant quand un avenant prolonge sa fin au-delà de la date de référence", () => {
    const resolved = getCurrentStructureParentActe(
      [
        parentActe({
          id: 7,
          endDate: "2024-01-01T12:00:00.000Z", // expired on its own
          children: [{ endDate: "2030-01-01T12:00:00.000Z" }], // avenant extends it
        }),
      ],
      "ARRETE_AUTORISATION",
      REFERENCE_DATE
    );
    expect(resolved).toEqual({ id: 7, startYear: 2020, endYear: 2030 });
  });

  it("retourne undefined pour un acte expiré ou pas encore commencé", () => {
    expect(
      getCurrentStructureParentActe(
        [
          parentActe({
            startDate: "2010-01-01T12:00:00.000Z",
            endDate: "2015-01-01T12:00:00.000Z",
          }),
        ],
        "ARRETE_AUTORISATION",
        REFERENCE_DATE
      )
    ).toBeUndefined();
    expect(
      getCurrentStructureParentActe(
        [
          parentActe({
            startDate: "2030-01-01T12:00:00.000Z",
            endDate: "2040-01-01T12:00:00.000Z",
          }),
        ],
        "ARRETE_AUTORISATION",
        REFERENCE_DATE
      )
    ).toBeUndefined();
  });

  it("retourne undefined quand aucun acte de la catégorie n'existe", () => {
    expect(
      getCurrentStructureParentActe(
        [parentActe({ category: "CONVENTION" })],
        "ARRETE_AUTORISATION",
        REFERENCE_DATE
      )
    ).toBeUndefined();
    expect(
      getCurrentStructureParentActe(
        undefined,
        "ARRETE_AUTORISATION",
        REFERENCE_DATE
      )
    ).toBeUndefined();
  });
});

describe("resolveAvenantParentIds", () => {
  const rules: CategoryDisplayRules = { ARRETE_EXTENSION: arreteExtensionRule };

  it("injecte le parent résolu (id + années) quand un parent courant existe", () => {
    const resolved = resolveAvenantParentIds(
      rules,
      [parentActe({ id: 42, category: "ARRETE_AUTORISATION" })],
      REFERENCE_DATE
    );
    expect(
      resolved.ARRETE_EXTENSION?.avenantAlternative?.resolvedParent
    ).toEqual({ id: 42, startYear: 2020, endYear: 2030 });
  });

  it("conserve l'avenantAlternative mais laisse resolvedParent undefined quand aucun parent courant n'existe", () => {
    const resolved = resolveAvenantParentIds(rules, [], REFERENCE_DATE);
    expect(resolved.ARRETE_EXTENSION?.avenantAlternative).toBeDefined();
    expect(
      resolved.ARRETE_EXTENSION?.avenantAlternative?.resolvedParent
    ).toBeUndefined();
  });

  it("laisse intactes les règles sans avenantAlternative", () => {
    const plainRules: CategoryDisplayRules = {
      AUTRE: { ...arreteExtensionRule, avenantAlternative: undefined },
    };
    const resolved = resolveAvenantParentIds(plainRules, [], REFERENCE_DATE);
    expect(resolved.AUTRE?.avenantAlternative).toBeUndefined();
  });
});

describe("getActesAdministratifsDefaultValues with avenant blocks", () => {
  const rules: CategoryDisplayRules = { ARRETE_EXTENSION: arreteExtensionRule };

  it("ne crée pas de placeholder en double pour un avenant déjà enregistré", () => {
    const defaults = getActesAdministratifsDefaultValues(
      [
        {
          id: 10,
          category: "ARRETE_AUTORISATION",
          parentId: 99,
          fileUploads: [{ key: "k" }],
        },
      ],
      rules
    );
    // Only the saved avenant should be present, no extra ARRETE_EXTENSION row
    expect(defaults).toHaveLength(1);
    expect(defaults[0].category).toBe("ARRETE_AUTORISATION");
    expect(defaults[0].parentId).toBe(99);
  });

  it("crée un placeholder autonome quand le bloc est vide", () => {
    const defaults = getActesAdministratifsDefaultValues([], rules);
    expect(defaults).toHaveLength(1);
    expect(defaults[0].category).toBe("ARRETE_EXTENSION");
    expect(defaults[0].parentId).toBeUndefined();
  });
});
