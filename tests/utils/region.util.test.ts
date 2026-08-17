import { describe, expect, it } from "vitest";

import {
  getDepartementNumerosForRegion,
  getDepartementsForRegion,
  getRegionFromDepartement,
} from "@/utils/region.util";

describe("region util", () => {
  describe("getRegionFromDepartement", () => {
    it("renvoie la région du département", () => {
      expect(getRegionFromDepartement("14")).toBe("Normandie");
    });

    it("renvoie la région pour un numéro non numérique", () => {
      expect(getRegionFromDepartement("2A")).toBe("Corse");
    });

    it("renvoie la région d'un département d'outre-mer", () => {
      expect(getRegionFromDepartement("976")).toBe("Mayotte");
    });

    it("renvoie null pour un numéro inconnu", () => {
      expect(getRegionFromDepartement("99")).toBeNull();
      expect(getRegionFromDepartement("")).toBeNull();
    });

    it("ne rattrape pas un numéro non normalisé", () => {
      expect(getRegionFromDepartement("2a")).toBeNull();
      expect(getRegionFromDepartement("014")).toBeNull();
    });
  });

  describe("getDepartementsForRegion", () => {
    it("renvoie les départements de la région", () => {
      expect(
        getDepartementsForRegion("Normandie").map(
          (departement) => departement.numero
        )
      ).toEqual(["14", "27", "50", "61", "76"]);
    });

    it("renvoie les départements complets, pas seulement leur numéro", () => {
      expect(getDepartementsForRegion("Normandie")[0]).toMatchObject({
        numero: "14",
        name: "Calvados",
        region: "Normandie",
      });
    });

    it("renvoie la Corse historique en plus des deux départements corses", () => {
      expect(
        getDepartementsForRegion("Corse").map(
          (departement) => departement.numero
        )
      ).toEqual(["2A", "2B", "20"]);
    });

    it("renvoie l'unique département d'une région d'outre-mer", () => {
      expect(
        getDepartementsForRegion("Guadeloupe").map(
          (departement) => departement.numero
        )
      ).toEqual(["971"]);
    });

    it("renvoie une liste vide pour une région inconnue", () => {
      expect(getDepartementsForRegion("Aquitaine")).toEqual([]);
      expect(getDepartementsForRegion("")).toEqual([]);
    });

    it("ne rattrape pas une casse différente", () => {
      expect(getDepartementsForRegion("normandie")).toEqual([]);
    });
  });

  describe("getDepartementNumerosForRegion", () => {
    it("renvoie les numéros dans l'ordre des départements de la région", () => {
      expect(getDepartementNumerosForRegion("Normandie")).toEqual([
        "14",
        "27",
        "50",
        "61",
        "76",
      ]);
    });

    it("renvoie une liste vide pour une région inconnue", () => {
      expect(getDepartementNumerosForRegion("Aquitaine")).toEqual([]);
    });
  });

  it("associe chaque département de la région à cette région", () => {
    const numeros = getDepartementNumerosForRegion("Bretagne");

    expect(numeros.length).toBeGreaterThan(0);
    numeros.forEach((numero) => {
      expect(getRegionFromDepartement(numero)).toBe("Bretagne");
    });
  });
});
