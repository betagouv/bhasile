import { describe, expect, it } from "vitest";

import { computeActiviteStatistiques } from "@/app/api/statistiques/activite/activite.util";
import type { StatistiqueDbActivite } from "@/app/api/statistiques/statistiques.db.type";
import { StructureType } from "@/types/structure.type";

import {
  buildTestDnaLinks,
  buildTestStatistiquesContext,
  buildTestStructureVersionTimeline,
} from "./test-helpers";

const activite = (
  partial: Partial<StatistiqueDbActivite> &
    Pick<StatistiqueDbActivite, "id" | "dnaCode" | "date">
): StatistiqueDbActivite => ({
  placesAutorisees: null,
  desinsectisation: null,
  remiseEnEtat: null,
  sousOccupation: null,
  travaux: null,
  placesIndisponibles: null,
  presencesInduesBPI: null,
  presencesInduesDeboutees: null,
  ...partial,
});

describe("activite statistics util", () => {
  const structures = [
    { id: 1, type: StructureType.CADA, departementAdministratif: "75" },
    { id: 2, type: StructureType.CAES, departementAdministratif: "75" },
    { id: 3, type: StructureType.CPH, departementAdministratif: "75" },
  ];

  const dnaLinks = buildTestDnaLinks([
    { structureId: 1, dnaCode: "DNA01" },
    { structureId: 2, dnaCode: "DNA02" },
    { structureId: 3, dnaCode: "DNA03" },
  ]);

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
          activite({
            id: 1,
            dnaCode: "DNA01",
            date: new Date("2025-03-15"),
            placesAutorisees: 100,
            placesIndisponibles: 10,
            presencesInduesBPI: 5,
            presencesInduesDeboutees: 2,
          }),
          activite({
            id: 2,
            dnaCode: "DNA02",
            date: new Date("2025-03-15"),
            placesAutorisees: 50,
            placesIndisponibles: 20,
            presencesInduesBPI: 4,
            presencesInduesDeboutees: 1,
          }),
          activite({
            id: 3,
            dnaCode: "DNA03",
            date: new Date("2025-03-15"),
            placesAutorisees: 40,
            placesIndisponibles: 4,
            presencesInduesBPI: 2,
            presencesInduesDeboutees: 3,
          }),
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
    expect(result.summary).toMatchObject({
      placesEnregistreesDna: 190,
      placesIndisponibles: 14,
      placesDisponibles: 176,
      presencesInduesTotal: 7,
    });
  });

  it("should aggregate months independently without inferring missing months", () => {
    const result = computeActiviteStatistiques(
      buildTestStatistiquesContext({
        structures: [structures[0]],
        allStructures: [structures[0]],
        typologies: [],
        adresses: [],
        departements: [],
        dnaLinks: [dnaLinks[0]],
        activites: [
          activite({
            id: 1,
            dnaCode: "DNA01",
            date: new Date("2025-02-10"),
            placesAutorisees: 80,
            placesIndisponibles: 8,
            presencesInduesBPI: 0,
            presencesInduesDeboutees: 0,
          }),
          activite({
            id: 4,
            dnaCode: "DNA01",
            date: new Date("2025-03-10"),
            placesAutorisees: 100,
            placesIndisponibles: 5,
            presencesInduesBPI: 0,
            presencesInduesDeboutees: 0,
          }),
        ],
      })
    );

    expect(result.byMonth).toHaveLength(2);
    expect(result.byMonth[0]?.placesIndisponibles).toBe(8);
    expect(result.byMonth[1]?.placesIndisponibles).toBe(5);
    expect(result.summary.placesEnregistreesDna).toBe(100);
    expect(result.summary.placesIndisponibles).toBe(5);
  });

  it("should sum latest activite per open structure in summary", () => {
    const result = computeActiviteStatistiques(
      buildTestStatistiquesContext({
        structures: [structures[0], structures[1]],
        allStructures: [structures[0], structures[1]],
        typologies: [],
        adresses: [],
        departements: [],
        dnaLinks: [dnaLinks[0], dnaLinks[1]],
        activites: [
          activite({
            id: 1,
            dnaCode: "DNA01",
            date: new Date("2025-01-10"),
            placesAutorisees: 80,
            desinsectisation: 8,
            placesIndisponibles: 8,
            presencesInduesBPI: 0,
            presencesInduesDeboutees: 0,
          }),
          activite({
            id: 2,
            dnaCode: "DNA01",
            date: new Date("2025-03-10"),
            placesAutorisees: 100,
            desinsectisation: 10,
            placesIndisponibles: 10,
            presencesInduesBPI: 0,
            presencesInduesDeboutees: 0,
          }),
          activite({
            id: 3,
            dnaCode: "DNA02",
            date: new Date("2025-02-10"),
            placesAutorisees: 50,
            desinsectisation: 5,
            placesIndisponibles: 5,
            presencesInduesBPI: 0,
            presencesInduesDeboutees: 0,
          }),
        ],
      })
    );

    expect(result.summary).toMatchObject({
      placesEnregistreesDna: 150,
      placesIndisponibles: 10,
      placesDisponibles: 140,
      motifsIndisponibilite: {
        desinsectisation: 10,
        remiseEnEtat: 0,
        sousOccupation: 0,
        travaux: 0,
      },
    });
    expect(result.byMonth).toHaveLength(3);
  });

  it("should exclude structures without activite from summary", () => {
    const result = computeActiviteStatistiques(
      buildTestStatistiquesContext({
        structures,
        allStructures: structures,
        typologies: [],
        adresses: [],
        departements: [],
        dnaLinks,
        activites: [
          activite({
            id: 1,
            dnaCode: "DNA01",
            date: new Date("2025-03-15"),
            placesAutorisees: 100,
            placesIndisponibles: 10,
            presencesInduesBPI: 0,
            presencesInduesDeboutees: 0,
          }),
        ],
      })
    );

    expect(result.summary.placesEnregistreesDna).toBe(100);
  });

  it("should resolve DNA to the structure owning it at activite date", () => {
    const structure = {
      id: 1,
      type: StructureType.CADA,
      departementAdministratif: "75",
    };
    const timeline = buildTestStructureVersionTimeline([
      {
        structureId: 1,
        structureVersionId: 10,
        effectiveDate: new Date("2020-01-01T00:00:00.000Z"),
      },
      {
        structureId: 1,
        structureVersionId: 11,
        effectiveDate: new Date("2025-01-01T00:00:00.000Z"),
      },
    ]);

    const result = computeActiviteStatistiques(
      buildTestStatistiquesContext({
        structures: [structure],
        allStructures: [structure],
        typologies: [],
        adresses: [],
        departements: [],
        structureVersionTimeline: timeline,
        dnaLinks: buildTestDnaLinks([
          { structureId: 1, structureVersionId: 10, dnaCode: "DNA-OLD" },
        ]),
        activites: [
          activite({
            id: 1,
            dnaCode: "DNA-OLD",
            date: new Date("2024-06-01"),
            placesAutorisees: 100,
            placesIndisponibles: 10,
            presencesInduesBPI: 0,
            presencesInduesDeboutees: 0,
          }),
          activite({
            id: 2,
            dnaCode: "DNA-OLD",
            date: new Date("2025-06-01"),
            placesAutorisees: 100,
            placesIndisponibles: 5,
            presencesInduesBPI: 0,
            presencesInduesDeboutees: 0,
          }),
        ],
      })
    );

    expect(result.byMonth).toHaveLength(1);
    expect(result.byMonth[0]?.placesEnregistreesDna).toBe(100);
    expect(result.summary.placesEnregistreesDna).toBe(100);
    expect(result.summary.placesIndisponibles).toBe(10);
  });
});
