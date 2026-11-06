import { describe, expect, it } from "vitest";

import {
  filterRegionsWithDepartements,
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

  describe("filterRegionsWithDepartements", () => {
    it("renvoie toutes les régions visibles avec leurs départements triés par nom quand la recherche est vide", () => {
      const resultats = filterRegionsWithDepartements("");

      expect(resultats.length).toBeGreaterThan(0);

      const bretagne = resultats.find(
        (regionWithDepartements) =>
          regionWithDepartements.region.name === "Bretagne"
      );

      expect(bretagne).toBeDefined();
      expect(
        bretagne?.departements.map((departement) => departement.name)
      ).toEqual(["Côtes-d'Armor", "Finistère", "Ille-et-Vilaine", "Morbihan"]);
    });

    it("filtre par nom de région (insensible à la casse et aux accents) et conserve tous ses départements", () => {
      const resultats = getRegionsWithResults("bretagne");

      expect(resultats).toHaveLength(1);
      expect(resultats[0].region.name).toBe("Bretagne");
      expect(resultats[0].departements).toHaveLength(4);
      expect(resultats[0].hasMatchingDepartement).toBe(false);
    });

    it("filtre par nom de département", () => {
      const resultats = getRegionsWithResults("finistere");

      expect(resultats).toHaveLength(1);
      expect(resultats[0].region.name).toBe("Bretagne");
      expect(resultats[0].departements).toHaveLength(1);
      expect(resultats[0].departements[0].name).toBe("Finistère");
      expect(resultats[0].hasMatchingDepartement).toBe(true);
    });

    it("filtre par numéro de département", () => {
      const resultats = getRegionsWithResults("35");

      expect(resultats).toHaveLength(1);
      expect(resultats[0].region.name).toBe("Bretagne");
      expect(resultats[0].departements).toHaveLength(1);
      expect(resultats[0].departements[0].numero).toBe("35");
      expect(resultats[0].hasMatchingDepartement).toBe(true);
    });

    it("signale un département correspondant même quand la région correspond aussi", () => {
      const resultats = getRegionsWithResults("guadeloupe");

      expect(resultats).toHaveLength(1);
      expect(resultats[0].departements).toHaveLength(1);
      expect(resultats[0].hasMatchingDepartement).toBe(true);
    });

    it("conserve toutes les régions visibles, sans département si rien ne correspond", () => {
      const resultats = filterRegionsWithDepartements(
        "RechercheInexistante123"
      );

      expect(resultats).toHaveLength(filterRegionsWithDepartements("").length);
      expect(
        resultats.every(
          (regionWithDepartements) =>
            regionWithDepartements.departements.length === 0
        )
      ).toBe(true);
    });
  });

  const getRegionsWithResults = (searchQuery: string) =>
    filterRegionsWithDepartements(searchQuery).filter(
      (regionWithDepartements) => regionWithDepartements.departements.length > 0
    );

  it("associe chaque département de la région à cette région", () => {
    const numeros = getDepartementNumerosForRegion("Bretagne");

    expect(numeros.length).toBeGreaterThan(0);
    numeros.forEach((numero) => {
      expect(getRegionFromDepartement(numero)).toBe("Bretagne");
    });
  });
});
