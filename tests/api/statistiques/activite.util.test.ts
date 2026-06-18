import { describe, expect, it } from "vitest";

import { StructureType } from "@/generated/prisma/client";

import { computeActiviteStatistiques } from "@/app/api/statistiques/activite/activite.util";

describe("activite statistiques util", () => {
  const structures = [
    { id: 1, type: StructureType.CADA, departementAdministratif: "75" },
    { id: 2, type: StructureType.CAES, departementAdministratif: "75" },
    { id: 3, type: StructureType.CPH, departementAdministratif: "75" },
  ];

  const dnaLinks = [
    { structureId: 1, dna: { code: "DNA01" } },
    { structureId: 2, dna: { code: "DNA02" } },
    { structureId: 3, dna: { code: "DNA03" } },
  ];

  it("should aggregate monthly stats with scoped rates", () => {
    const result = computeActiviteStatistiques(
      [
        {
          dnaCode: "DNA01",
          date: new Date("2025-03-15"),
          placesAutorisees: 100,
          placesIndisponibles: 10,
          presencesInduesBPI: 5,
          presencesInduesDeboutees: 2,
        },
        {
          dnaCode: "DNA02",
          date: new Date("2025-03-15"),
          placesAutorisees: 50,
          placesIndisponibles: 20,
          presencesInduesBPI: 4,
          presencesInduesDeboutees: 1,
        },
        {
          dnaCode: "DNA03",
          date: new Date("2025-03-15"),
          placesAutorisees: 40,
          placesIndisponibles: 4,
          presencesInduesBPI: 2,
          presencesInduesDeboutees: 3,
        },
      ],
      dnaLinks,
      structures
    );

    expect(result.byMonth).toHaveLength(1);
    expect(result.byMonth[0]).toMatchObject({
      placesEnregistreesDna: 190,
      placesIndisponibles: 14,
      tauxIndisponibilite: 14 / 140,
      presencesInduesBPI: 6,
      presencesInduesDeboutees: 4,
      presencesInduesTotal: 10,
      tauxPresencesInduesTotal: 10 / 90,
    });
  });
});
