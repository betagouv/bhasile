import { describe, expect, it } from "vitest";

import { computePlacesStatistiques } from "@/app/api/statistiques/places/places.util";
import { StructureType } from "@/generated/prisma/client";

describe("places statistics util", () => {
  const structures = [
    { id: 1, type: StructureType.CADA, departementAdministratif: "01" },
    { id: 2, type: StructureType.CPH, departementAdministratif: "02" },
    { id: 3, type: StructureType.HUDA, departementAdministratif: "03" },
  ];

  const departements = [
    { numero: "01", name: "Ain", population: 100_000 },
    { numero: "02", name: "Aisne", population: 50_000 },
  ];

  it("aggregates equipment rate from total places and total population", () => {
    const result = computePlacesStatistiques(
      structures.slice(0, 2),
      [
        {
          structureId: 1,
          year: 2024,
          placesAutorisees: 100,
          pmr: 0,
          lgbt: 0,
          fvvTeh: 0,
        },
        {
          structureId: 2,
          year: 2024,
          placesAutorisees: 50,
          pmr: 0,
          lgbt: 0,
          fvvTeh: 0,
        },
      ],
      [],
      [],
      departements
    );

    expect(result.totalPlaces).toBe(150);
    expect(result.population).toBe(150_000);
  });

  it("returns null equipment rate when a department population is missing", () => {
    const result = computePlacesStatistiques(
      [structures[0]],
      [
        {
          structureId: 1,
          year: 2024,
          placesAutorisees: 100,
          pmr: 0,
          lgbt: 0,
          fvvTeh: 0,
        },
      ],
      [],
      [],
      [{ numero: "01", name: "Ain", population: null }]
    );

    expect(result.tauxEquipement).toBeNull();
    expect(result.population).toBeNull();
  });

  it("resolves global indicators from the latest non-null typology value per field", () => {
    const result = computePlacesStatistiques(
      [structures[0]],
      [
        {
          structureId: 1,
          year: 2023,
          placesAutorisees: 80,
          pmr: 10,
          lgbt: 1,
          fvvTeh: 0,
        },
        {
          structureId: 1,
          year: 2024,
          placesAutorisees: 100,
          pmr: null,
          lgbt: 3,
          fvvTeh: 2,
        },
      ],
      [],
      [],
      departements.slice(0, 1)
    );

    expect(result.totalPlaces).toBe(100);
    expect(result.pmr).toBe(10);
    expect(result.lgbt).toBe(3);
    expect(result.fvvTeh).toBe(2);
  });

  it("excludes structures without typologie from place totals", () => {
    const result = computePlacesStatistiques(
      structures,
      [
        {
          structureId: 1,
          year: 2024,
          placesAutorisees: 100,
          pmr: 0,
          lgbt: 0,
          fvvTeh: 0,
        },
      ],
      [],
      [],
      departements.slice(0, 1)
    );

    expect(result.totalPlaces).toBe(100);
    expect(result.byYear).toHaveLength(1);
    expect(result.byYear[0]?.year).toBe(2024);
    expect(result.byYear[0]?.totalPlaces).toBe(100);
  });
});
