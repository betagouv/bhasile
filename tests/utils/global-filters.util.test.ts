import { describe, expect, it } from "vitest";

import {
  getGlobalFilters,
  matchesGlobalFilters,
  omitGlobalFilters,
  parseGlobalFilters,
  pickGlobalFilters,
  toGlobalFiltersSearchParams,
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

    it("écarte les identifiants d'opérateur non numériques", () => {
      const params = new URLSearchParams("operateurs=Coallia,4");

      expect(pickGlobalFilters(params).get("operateurs")).toBe("4");
      expect(pickGlobalFilters(new URLSearchParams("operateurs=x")).size).toBe(
        0
      );
    });

    it("tolère l'absence de paramètres", () => {
      expect(pickGlobalFilters(null).size).toBe(0);
    });
  });

  describe("getGlobalFilters", () => {
    it("lit les trois filtres globaux des searchParams d'une page", () => {
      expect(
        getGlobalFilters({ departements: "75", types: ["CADA", "HUDA"] })
      ).toEqual({ departements: "75", operateurs: null, types: "CADA" });
    });
  });

  describe("omitGlobalFilters", () => {
    it("retire les filtres globaux en gardant les autres paramètres", () => {
      const params = new URLSearchParams("departements=75&page=2&types=CADA");

      expect(omitGlobalFilters(params).toString()).toBe("page=2");
    });
  });

  describe("toGlobalFiltersSearchParams", () => {
    it("n'inclut que les filtres renseignés", () => {
      expect(
        toGlobalFiltersSearchParams({
          departements: "75",
          operateurs: null,
          types: "CADA",
        }).toString()
      ).toBe("departements=75&types=CADA");
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
