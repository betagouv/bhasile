import { describe, expect, it } from "vitest";

import {
  collectCurrentDnaCodesInDepartement,
  computeDepartementAverage,
  processActivitesForStructure,
} from "@/app/api/activites/activite.util";

type Activite = Parameters<typeof computeDepartementAverage>[0][number];

const makeActivite = (fields: {
  date?: Date;
  placesAutorisees?: number | null;
  placesIndisponibles?: number | null;
  tauxOccupation?: number | null;
  presencesInduesBPI?: number | null;
  presencesInduesDeboutees?: number | null;
}): Activite =>
  ({
    id: 1,
    date: new Date("2023-06-01T00:00:00.000Z"),
    placesAutorisees: null,
    placesIndisponibles: null,
    tauxOccupation: null,
    presencesInduesBPI: null,
    presencesInduesDeboutees: null,
    ...fields,
  }) as unknown as Activite;

type Structure = Parameters<
  typeof collectCurrentDnaCodesInDepartement
>[0][number];

let versionIdSeq = 0;

const makeStructure = (
  departementAdministratif: string | null,
  dnaCodes: string[],
  effectiveDate: Date = new Date("2020-01-01T00:00:00.000Z")
): Structure => {
  versionIdSeq += 1;
  return {
    structureVersions: [
      {
        id: versionIdSeq,
        effectiveDate,
        structureVersionTransformationId: null,
        structureVersionTransformation: null,
        departementAdministratif,
        dnaStructures: dnaCodes.map((code) => ({ dna: { code } })),
      },
    ],
  } as unknown as Structure;
};

describe("computeDepartementAverage", () => {
  it("renvoie null quand il n'y a aucune activité", () => {
    expect(computeDepartementAverage([], "75")).toBeNull();
  });

  it("moyenne chaque champ indépendamment des null et arrondit à 2 décimales", () => {
    const stats = computeDepartementAverage(
      [
        makeActivite({
          placesAutorisees: 10,
          placesIndisponibles: 2,
          tauxOccupation: 0.5,
          presencesInduesBPI: 3,
          presencesInduesDeboutees: 1,
        }),
        makeActivite({
          placesAutorisees: 20,
          placesIndisponibles: null,
          tauxOccupation: 0.5,
          presencesInduesBPI: null,
          presencesInduesDeboutees: 5,
        }),
      ],
      "75"
    );

    expect(stats).toEqual({
      numero: "75",
      averagePlacesAutorisees: 15,
      averagePlacesIndisponibles: 2,
      averagePlacesOccupees: 4,
      averagePlacesVacantes: 4,
      averagePresencesInduesBPI: 3,
      averagePresencesInduesDeboutees: 3,
      averagePresencesIndues: 4.5,
    });
  });

  it("exclut une activité dont presencesIndues est entièrement null, mais compte un seul sous-total manquant comme 0", () => {
    const stats = computeDepartementAverage(
      [
        makeActivite({ presencesInduesBPI: 4, presencesInduesDeboutees: 2 }),
        makeActivite({
          presencesInduesBPI: null,
          presencesInduesDeboutees: null,
        }),
        makeActivite({ presencesInduesBPI: null, presencesInduesDeboutees: 3 }),
      ],
      "75"
    );
    expect(stats?.averagePresencesIndues).toBe(4.5);
  });
});

describe("collectCurrentDnaCodesInDepartement", () => {
  const now = new Date("2025-01-01T00:00:00.000Z");

  it("collecte les dnaCodes des versions courantes du département, dédupliqués", () => {
    const codes = collectCurrentDnaCodesInDepartement(
      [makeStructure("75", ["D1", "D2"]), makeStructure("75", ["D2", "D3"])],
      "75",
      now
    );
    expect([...codes].sort()).toEqual(["D1", "D2", "D3"]);
  });

  it("exclut les structures dont la version courante est dans un autre département", () => {
    const codes = collectCurrentDnaCodesInDepartement(
      [makeStructure("75", ["D1"]), makeStructure("92", ["D2"])],
      "75",
      now
    );
    expect(codes).toEqual(["D1"]);
  });

  it("exclut les structures sans version courante (version future)", () => {
    const codes = collectCurrentDnaCodesInDepartement(
      [makeStructure("75", ["D1"], new Date("2099-01-01T00:00:00.000Z"))],
      "75",
      now
    );
    expect(codes).toEqual([]);
  });
});

describe("processActivitesForStructure", () => {
  it("regroupe par date et somme les places sur les DNA d'une même date", () => {
    const rows = processActivitesForStructure([
      makeActivite({
        date: new Date("2023-06-01T00:00:00.000Z"),
        placesAutorisees: 10,
      }),
      makeActivite({
        date: new Date("2023-06-01T00:00:00.000Z"),
        placesAutorisees: 5,
      }),
    ]);
    expect(rows).toHaveLength(1);
    expect(rows[0].placesEnregistreesDna).toBe(15);
  });

  it("renvoie un tableau vide quand il n'y a pas d'activité", () => {
    expect(processActivitesForStructure([])).toEqual([]);
    expect(processActivitesForStructure(null)).toEqual([]);
  });
});
