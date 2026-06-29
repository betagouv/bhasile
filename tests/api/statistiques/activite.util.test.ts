import { describe, expect, it } from "vitest";

import { computeActiviteStatistiques } from "@/app/api/statistiques/activite/activite.util";
import { StructureType } from "@/types/structure.type";

import { buildTestStatistiquesContext } from "./test-helpers";

describe("activite statistics util", () => {
  const structures = [
    { id: 1, type: StructureType.CADA, departementAdministratif: "75" },
    { id: 2, type: StructureType.CAES, departementAdministratif: "75" },
    { id: 3, type: StructureType.CPH, departementAdministratif: "75" },
  ];

  const dnaLinks = [
    { id: 1, structureId: 1, dna: { code: "DNA01" } },
    { id: 2, structureId: 2, dna: { code: "DNA02" } },
    { id: 3, structureId: 3, dna: { code: "DNA03" } },
  ];

  it("should apply type scoping to rate denominators", () => {
    const result = computeActiviteStatistiques(
      buildTestStatistiquesContext({
        structures,
        allStructures: structures,
        typologies: [],
        adresses: [],
        departements: [],
        dnaLinks,
        activites: [
          {
            id: 1,
            dnaCode: "DNA01",
            date: new Date("2025-03-15"),
            placesAutorisees: 100,
            placesIndisponibles: 10,
            presencesInduesBPI: 5,
            presencesInduesDeboutees: 2,
          },
          {
            id: 2,
            dnaCode: "DNA02",
            date: new Date("2025-03-15"),
            placesAutorisees: 50,
            placesIndisponibles: 20,
            presencesInduesBPI: 4,
            presencesInduesDeboutees: 1,
          },
          {
            id: 3,
            dnaCode: "DNA03",
            date: new Date("2025-03-15"),
            placesAutorisees: 40,
            placesIndisponibles: 4,
            presencesInduesBPI: 2,
            presencesInduesDeboutees: 3,
          },
        ],
      })
    );

    const march2025 = result.byMonth[0];

    expect(march2025).toMatchObject({
      placesEnregistreesDna: 190,
      placesIndisponibles: 14,
      presencesInduesBPI: 5,
      presencesInduesDeboutees: 2,
      presencesInduesTotal: 7,
    });
    expect(march2025?.tauxIndisponibilite).toBe(0.1);
    expect(march2025?.tauxPresencesInduesTotal).toBe(0.07);
  });

  it("should aggregate months independently", () => {
    const result = computeActiviteStatistiques(
      buildTestStatistiquesContext({
        structures: [structures[0]],
        allStructures: [structures[0]],
        typologies: [],
        adresses: [],
        departements: [],
        dnaLinks: [dnaLinks[0]],
        activites: [
          {
            id: 1,
            dnaCode: "DNA01",
            date: new Date("2025-02-10"),
            placesAutorisees: 80,
            placesIndisponibles: 8,
            presencesInduesBPI: 0,
            presencesInduesDeboutees: 0,
          },
          {
            id: 4,
            dnaCode: "DNA01",
            date: new Date("2025-03-10"),
            placesAutorisees: 100,
            placesIndisponibles: 5,
            presencesInduesBPI: 0,
            presencesInduesDeboutees: 0,
          },
        ],
      })
    );

    expect(result.byMonth).toHaveLength(2);
    expect(result.byMonth[0]?.placesIndisponibles).toBe(8);
    expect(result.byMonth[1]?.placesIndisponibles).toBe(5);
  });
});
