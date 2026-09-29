import { describe, expect, it } from "vitest";

import { buildTypesSummary } from "@/utils/structureType.util";

describe("buildTypesSummary", () => {
  it("affiche le type seul quand un seul est sélectionné", () => {
    expect(buildTypesSummary(["CADA"])).toBe("CADA");
  });

  it("ordonne selon la liste des types quel que soit l'ordre des clics", () => {
    expect(buildTypesSummary(["HUDA", "CADA"])).toBe("CADA +1");
  });

  it("place un type inconnu en dernier", () => {
    expect(buildTypesSummary(["INCONNU", "CPH"])).toBe("CPH +1");
  });
});
