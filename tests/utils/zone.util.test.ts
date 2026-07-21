import { describe, expect, it } from "vitest";

import { buildZoneSummary } from "@/app/utils/zone.util";

describe("zone util", () => {
  describe("buildZoneSummary", () => {
    it("affiche le nom de la région quand tous ses départements sont sélectionnés", () => {
      expect(buildZoneSummary(["14", "27", "50", "61", "76"])).toBe("Normandie");
    });

    it("affiche les noms des départements quand la région est partielle", () => {
      expect(buildZoneSummary(["14", "50"])).toBe("Calvados +1");
    });

    it("place les régions complètes avant les départements isolés", () => {
      expect(
        buildZoneSummary(["14", "27", "50", "61", "76", "29", "35"])
      ).toBe("Normandie +2");
    });

    it("trie les régions complètes par ordre alphabétique", () => {
      expect(
        buildZoneSummary([
          "14",
          "27",
          "50",
          "61",
          "76",
          "22",
          "29",
          "35",
          "56",
        ])
      ).toBe("Bretagne +1");
    });

    it("renvoie undefined pour une liste vide", () => {
      expect(buildZoneSummary([])).toBeUndefined();
    });

    it("renvoie undefined quand aucun numéro ne correspond à un département", () => {
      expect(buildZoneSummary(["99", "00"])).toBeUndefined();
    });
  });
});
