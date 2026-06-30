import { describe, expect, it } from "vitest";

import { computePlacesStatistiques } from "@/app/api/statistiques/places/places.util";
import { StructureType } from "@/types/structure.type";

import { buildTestStatistiquesContext } from "./test-helpers";

describe("places statistics util", () => {
  const structures = [
    { id: 1, type: StructureType.CADA, departementAdministratif: "01" },
    { id: 2, type: StructureType.CPH, departementAdministratif: "02" },
    { id: 3, type: StructureType.HUDA, departementAdministratif: "03" },
  ];

  const departements = [
    { id: 1, numero: "01", name: "Ain", population: 100_000 },
    { id: 2, numero: "02", name: "Aisne", population: 50_000 },
  ];

  it("should compute equipment rate from places and population", () => {
    const result = computePlacesStatistiques(
      buildTestStatistiquesContext({
        structures: structures.slice(0, 2),
        typologies: [
          {
            id: 1,
            structureId: 1,
            year: 2024,
            placesAutorisees: 100,
            pmr: 0,
            lgbt: 0,
            fvvTeh: 0,
          },
          {
            id: 2,
            structureId: 2,
            year: 2024,
            placesAutorisees: 50,
            pmr: 0,
            lgbt: 0,
            fvvTeh: 0,
          },
        ],
        adresses: [],
        departements,
      })
    );

    expect(result.totalPlaces).toBe(150);
    expect(result.population).toBe(150_000);
    expect(result.tauxEquipement).toBe(0.001);
  });

  it("should not round equipment rate to zero for small ratios", () => {
    const result = computePlacesStatistiques(
      buildTestStatistiquesContext({
        structures: [structures[0]],
        typologies: [
          {
            id: 1,
            structureId: 1,
            year: 2024,
            placesAutorisees: 4155,
            pmr: 0,
            lgbt: 0,
            fvvTeh: 0,
          },
        ],
        adresses: [],
        departements: [
          { id: 1, numero: "75", name: "Paris", population: 59_931_329 },
        ],
      })
    );

    expect(result.tauxEquipement).toBe(0.000_069_3);
    expect(result.tauxEquipement).not.toBe(0);
  });

  it("should return null equipment rate without population", () => {
    const result = computePlacesStatistiques(
      buildTestStatistiquesContext({
        structures: [structures[0]],
        typologies: [
          {
            id: 1,
            structureId: 1,
            year: 2024,
            placesAutorisees: 100,
            pmr: 0,
            lgbt: 0,
            fvvTeh: 0,
          },
        ],
        adresses: [],
        departements: [{ id: 1, numero: "01", name: "Ain", population: null }],
      })
    );

    expect(result.tauxEquipement).toBeNull();
    expect(result.population).toBeNull();
  });

  it("should resolve indicators from latest non-null typologie per field", () => {
    const result = computePlacesStatistiques(
      buildTestStatistiquesContext({
        structures: [structures[0]],
        typologies: [
          {
            id: 1,
            structureId: 1,
            year: 2023,
            placesAutorisees: 80,
            pmr: 10,
            lgbt: 1,
            fvvTeh: 0,
          },
          {
            id: 2,
            structureId: 1,
            year: 2024,
            placesAutorisees: 100,
            pmr: null,
            lgbt: 3,
            fvvTeh: 2,
          },
        ],
        adresses: [],
        departements: departements.slice(0, 1),
      })
    );

    expect(result.totalPlaces).toBe(100);
    expect(result.pmr).toBe(10);
    expect(result.lgbt).toBe(3);
    expect(result.fvvTeh).toBe(2);
  });

  it("should exclude structures without typologie from totals", () => {
    const result = computePlacesStatistiques(
      buildTestStatistiquesContext({
        structures,
        typologies: [
          {
            id: 1,
            structureId: 1,
            year: 2024,
            placesAutorisees: 100,
            pmr: 0,
            lgbt: 0,
            fvvTeh: 0,
          },
        ],
        adresses: [],
        departements: departements.slice(0, 1),
      })
    );

    expect(result.totalPlaces).toBe(100);
    expect(result.byYear).toHaveLength(1);
    expect(result.byYear[0]?.year).toBe(2024);
    expect(result.byYear[0]?.totalPlaces).toBe(100);
  });
});
