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
  it("includes the avenant parent category and dedupes", () => {
    expect(
      getCategoryGroup("ARRETE_EXTENSION", undefined, "ARRETE_AUTORISATION")
    ).toEqual(["ARRETE_EXTENSION", "ARRETE_AUTORISATION"]);
  });

  it("does not duplicate when the parent category equals the block category", () => {
    expect(getCategoryGroup("CONVENTION", undefined, "CONVENTION")).toEqual([
      "CONVENTION",
    ]);
  });
});

describe("getCurrentStructureParentActe", () => {
  it("returns the parent acte in effect at the reference date, with its start/end years", () => {
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

  it("uses the most future avenant endDate as the effective end (max children ?? parent)", () => {
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

  it("treats an acte as current when an avenant extends its end past the reference date", () => {
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

  it("returns undefined for an expired or not-yet-started acte", () => {
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

  it("returns undefined when no acte of the category exists", () => {
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

  it("injects the resolved parent (id + years) when a current parent exists", () => {
    const resolved = resolveAvenantParentIds(
      rules,
      [parentActe({ id: 42, category: "ARRETE_AUTORISATION" })],
      REFERENCE_DATE
    );
    expect(
      resolved.ARRETE_EXTENSION?.avenantAlternative?.resolvedParent
    ).toEqual({ id: 42, startYear: 2020, endYear: 2030 });
  });

  it("keeps the avenantAlternative but leaves resolvedParent undefined when no current parent exists", () => {
    const resolved = resolveAvenantParentIds(rules, [], REFERENCE_DATE);
    expect(resolved.ARRETE_EXTENSION?.avenantAlternative).toBeDefined();
    expect(
      resolved.ARRETE_EXTENSION?.avenantAlternative?.resolvedParent
    ).toBeUndefined();
  });

  it("leaves rules without an avenantAlternative untouched", () => {
    const plainRules: CategoryDisplayRules = {
      AUTRE: { ...arreteExtensionRule, avenantAlternative: undefined },
    };
    const resolved = resolveAvenantParentIds(plainRules, [], REFERENCE_DATE);
    expect(resolved.AUTRE?.avenantAlternative).toBeUndefined();
  });
});

describe("getActesAdministratifsDefaultValues with avenant blocks", () => {
  const rules: CategoryDisplayRules = { ARRETE_EXTENSION: arreteExtensionRule };

  it("does not seed a duplicate placeholder for a saved avenant", () => {
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

  it("seeds a standalone placeholder when the block is empty", () => {
    const defaults = getActesAdministratifsDefaultValues([], rules);
    expect(defaults).toHaveLength(1);
    expect(defaults[0].category).toBe("ARRETE_EXTENSION");
    expect(defaults[0].parentId).toBeUndefined();
  });
});
