import { describe, expect, it } from "vitest";

import {
  matchesGlobalFilters,
  parseGlobalFilters,
  pickGlobalFilters,
  withGlobalFilters,
} from "@/utils/global-filters.util";

describe("global filters util", () => {
  describe("pickGlobalFilters", () => {
    it("ne garde que les filtres globaux non vides", () => {
      const params = new URLSearchParams(
        "departements=75&page=2&types=&operateurs=4&vue=carte"
      );

      expect(pickGlobalFilters(params).toString()).toBe(
        "departements=75&operateurs=4"
      );
    });

    it("tolère l'absence de paramètres", () => {
      expect(pickGlobalFilters(null).size).toBe(0);
    });
  });

  describe("withGlobalFilters", () => {
    it("ajoute les filtres au chemin", () => {
      expect(
        withGlobalFilters("/cpoms", new URLSearchParams("types=CADA"))
      ).toBe("/cpoms?types=CADA");
    });

    it("laisse le chemin intact sans filtre", () => {
      expect(withGlobalFilters("/cpoms", new URLSearchParams())).toBe("/cpoms");
    });
  });

  describe("matchesGlobalFilters", () => {
    const target = {
      departements: ["75", "92"],
      operateurIds: [4],
      types: ["CADA"],
    };

    it("accepte tout sans filtre", () => {
      expect(matchesGlobalFilters(target, parseGlobalFilters({}))).toBe(true);
    });

    it("accepte dès qu'une valeur correspond pour chaque filtre", () => {
      expect(
        matchesGlobalFilters(
          target,
          parseGlobalFilters({
            departements: "92,93",
            operateurs: "4",
            types: "CADA,HUDA",
          })
        )
      ).toBe(true);
    });

    it("rejette quand un des filtres ne correspond pas", () => {
      expect(
        matchesGlobalFilters(target, parseGlobalFilters({ operateurs: "5" }))
      ).toBe(false);
    });

    it("ignore un filtre sans dimension correspondante sur la cible", () => {
      expect(
        matchesGlobalFilters(
          { departements: ["75"] },
          parseGlobalFilters({ types: "CADA" })
        )
      ).toBe(true);
    });

    it("rejette une cible sans valeur pour un filtre actif", () => {
      expect(
        matchesGlobalFilters(
          { operateurIds: [null] },
          parseGlobalFilters({ operateurs: "4" })
        )
      ).toBe(false);
    });
  });
});
