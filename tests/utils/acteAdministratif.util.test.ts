import { describe, expect, it } from "vitest";

import {
  getActesAdministratifsDefaultValues,
  getCategoryGroup,
  getLatestStructureParentActeId,
  resolveAvenantParentIds,
} from "@/app/utils/acteAdministratif.util";
import {
  AdditionalFieldsType,
  CategoryDisplayRule,
  CategoryDisplayRules,
} from "@/config/acte-administratif.config";

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

describe("getLatestStructureParentActeId", () => {
  it("returns the id of the most recent acte by startDate", () => {
    const id = getLatestStructureParentActeId(
      [
        { id: 1, category: "ARRETE_AUTORISATION", startDate: "2020-01-01" },
        { id: 2, category: "ARRETE_AUTORISATION", startDate: "2023-06-01" },
        { id: 3, category: "CONVENTION", startDate: "2024-01-01" },
      ],
      "ARRETE_AUTORISATION"
    );
    expect(id).toBe(2);
  });

  it("breaks ties on equal startDate with the highest id", () => {
    const id = getLatestStructureParentActeId(
      [
        { id: 5, category: "CONVENTION", startDate: "2023-01-01" },
        { id: 9, category: "CONVENTION", startDate: "2023-01-01" },
      ],
      "CONVENTION"
    );
    expect(id).toBe(9);
  });

  it("returns undefined when no acte of the category exists", () => {
    expect(
      getLatestStructureParentActeId(
        [{ id: 1, category: "CONVENTION", startDate: "2024-01-01" }],
        "ARRETE_AUTORISATION"
      )
    ).toBeUndefined();
    expect(
      getLatestStructureParentActeId(undefined, "ARRETE_AUTORISATION")
    ).toBeUndefined();
  });
});

describe("resolveAvenantParentIds", () => {
  const rules: CategoryDisplayRules = { ARRETE_EXTENSION: arreteExtensionRule };

  it("injects the resolved parentId when an eligible parent exists", () => {
    const resolved = resolveAvenantParentIds(rules, [
      { id: 42, category: "ARRETE_AUTORISATION", startDate: "2024-01-01" },
    ]);
    expect(resolved.ARRETE_EXTENSION?.avenantAlternative?.parentId).toBe(42);
  });

  it("keeps the avenantAlternative but leaves parentId undefined when no eligible parent exists", () => {
    // The avenantAlternative must survive so a saved avenant stays recognized/rendered;
    // the missing parentId is what hides the "create avenant" choice downstream.
    const resolved = resolveAvenantParentIds(rules, []);
    expect(resolved.ARRETE_EXTENSION?.avenantAlternative).toBeDefined();
    expect(
      resolved.ARRETE_EXTENSION?.avenantAlternative?.parentId
    ).toBeUndefined();
  });

  it("leaves rules without an avenantAlternative untouched", () => {
    const plainRules: CategoryDisplayRules = {
      AUTRE: { ...arreteExtensionRule, avenantAlternative: undefined },
    };
    const resolved = resolveAvenantParentIds(plainRules, []);
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
