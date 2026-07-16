import { describe, expect, it } from "vitest";

import { getActualisationActesAdministratifsCategoryToDisplay } from "@/config/structure.config";
import { StructureType } from "@/types/structure.type";

import { createStructure } from "../test-utils/structure.factory";

describe("getActualisationActesAdministratifsCategoryToDisplay", () => {
  it("expose arrêté de tarification et convention pour une autorisée", () => {
    const structure = createStructure({ id: 1, type: StructureType.CADA });

    const rules =
      getActualisationActesAdministratifsCategoryToDisplay(structure);

    expect(Object.keys(rules).sort()).toEqual([
      "ARRETE_TARIFICATION",
      "CONVENTION",
    ]);
    expect(rules.ARRETE_TARIFICATION?.isOptional).toBe(false);
    expect(rules.CONVENTION?.isOptional).toBe(true);
    expect(rules.ARRETE_TARIFICATION?.canAddAvenant).toBe(false);
    expect(rules.CONVENTION?.canAddAvenant).toBe(false);
  });

  it("expose convention obligatoire et autres documents pour une subventionnée", () => {
    const structure = createStructure({ id: 1, type: StructureType.HUDA });

    const rules =
      getActualisationActesAdministratifsCategoryToDisplay(structure);

    expect(Object.keys(rules).sort()).toEqual(["AUTRE", "CONVENTION"]);
    expect(rules.CONVENTION?.isOptional).toBe(false);
  });

  it("ne renvoie aucune catégorie sans structure", () => {
    expect(
      getActualisationActesAdministratifsCategoryToDisplay(undefined)
    ).toEqual({});
  });
});
