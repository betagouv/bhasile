import { describe, expect, it } from "vitest";

import { buildZoneSummary, reduceToSingleZone } from "@/app/utils/zone.util";

describe("zone util", () => {
  describe("buildZoneSummary", () => {
    it("affiche le nom de la région quand tous ses départements sont sélectionnés", () => {
      expect(buildZoneSummary(["14", "27", "50", "61", "76"])).toBe(
        "Normandie"
      );
    });

    it("affiche les noms des départements quand la région est partielle", () => {
      expect(buildZoneSummary(["14", "50"])).toBe("Calvados +1");
    });

    it("conserve un code inconnu pour ne pas afficher un filtre actif comme vide", () => {
      expect(buildZoneSummary(["999"])).toBe("999");
      expect(buildZoneSummary(["14", "999"])).toBe("Calvados +1");
    });

    it("place les régions complètes avant les départements isolés", () => {
      expect(buildZoneSummary(["14", "27", "50", "61", "76", "29", "35"])).toBe(
        "Normandie +2"
      );
    });

    it("trie les régions complètes par ordre alphabétique", () => {
      expect(
        buildZoneSummary(["14", "27", "50", "61", "76", "22", "29", "35", "56"])
      ).toBe("Bretagne +1");
    });

    it("renvoie undefined pour une liste vide", () => {
      expect(buildZoneSummary([])).toBeUndefined();
    });

    it("renvoie undefined pour une sélection vide", () => {
      expect(buildZoneSummary([])).toBeUndefined();
    });
  });

  describe("reduceToSingleZone", () => {
    it("garde une sélection vide ou déjà réduite à une seule zone", () => {
      expect(reduceToSingleZone([])).toEqual([]);
      expect(reduceToSingleZone(["14"])).toEqual(["14"]);
      expect(reduceToSingleZone(["14", "27", "50", "61", "76"])).toEqual([
        "14",
        "27",
        "50",
        "61",
        "76",
      ]);
    });

    it("garde la première région complète par ordre alphabétique plutôt qu'un département", () => {
      const reduced = reduceToSingleZone([
        "29",
        "22",
        "35",
        "56",
        "14",
        "27",
        "50",
        "61",
        "76",
        "33",
      ]);

      expect(reduced.sort()).toEqual(["22", "29", "35", "56"]);
    });

    it("garde le premier département par ordre alphabétique sans région complète", () => {
      expect(reduceToSingleZone(["50", "33", "14"])).toEqual(["14"]);
    });
  });
});
