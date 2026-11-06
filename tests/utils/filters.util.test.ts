import { describe, expect, it } from "vitest";

import {
  matchesFilters,
  parseFilters,
  pickFilters,
} from "@/utils/filters.util";

describe("filters util", () => {
  it("ne garde que les filtres renseignés, avec des identifiants d'opérateur valides", () => {
    const params = new URLSearchParams(
      "departements=75&page=2&types=&operateurs=Coallia,4"
    );

    expect(pickFilters(params).toString()).toBe("departements=75&operateurs=4");
  });

  it("accepte une cible dès qu'une valeur correspond à chaque filtre actif", () => {
    const filters = parseFilters({ departements: "92,93", types: "CADA" });

    expect(
      matchesFilters(
        { departements: ["75", "92"], operateurIds: [4], types: ["CADA"] },
        filters
      )
    ).toBe(true);
    expect(matchesFilters({ departements: ["92"] }, filters)).toBe(true);
  });

  it("rejette une cible sans valeur correspondant à un filtre actif", () => {
    const filters = parseFilters({ operateurs: "4" });

    expect(matchesFilters({ operateurIds: [5] }, filters)).toBe(false);
    expect(matchesFilters({ operateurIds: [null] }, filters)).toBe(false);
  });
});
