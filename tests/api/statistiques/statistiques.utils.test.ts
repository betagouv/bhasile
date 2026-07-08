import { describe, expect, it } from "vitest";

import type { StatistiqueDbStructure } from "@/app/api/statistiques/statistiques.db.type";
import {
  filterByActiveStructureId,
  getEffectiveStructureVersionAtDate,
  lookupActiveStructureIds,
  lookupStructureIdsForDnaAtDate,
  mapTypologieYears,
  mapVersionsToStructures,
  matchesStatistiquesPerimeterFilters,
  type StatistiquesResolvedPerimeterFilters,
  structuresActiveInPeriod,
} from "@/app/api/statistiques/statistiques.utils";
import { StructureType } from "@/types/structure.type";

import {
  buildTestActivityIndex,
  buildTestDnaLinks,
  buildTestStructureVersionTimeline,
} from "./test-helpers";

/** Structure 3 closed on 2025-02-01; reference date 2025-06-15. */
const FEBRUARY_2025_CLOSURE_FIXTURE = {
  referenceDate: new Date("2025-06-15T12:00:00.000Z"),
  structureIds: [1, 2, 3],
  activityOptions: {
    openingDate: new Date("2020-01-01T00:00:00.000Z"),
    closureDates: new Map<number, Date | null>([
      [1, null],
      [2, null],
      [3, new Date("2025-02-01T00:00:00.000Z")],
    ]),
    typologieYears: [2025, 2026],
    referenceYear: 2026,
    periodDates: [
      new Date("2025-02-15T00:00:00.000Z"),
      new Date("2025-03-15T00:00:00.000Z"),
    ],
  },
};

const testStructure = (
  id: number,
  type: StructureType = StructureType.CADA
): StatistiqueDbStructure => ({
  id,
  type,
  departementAdministratif: "01",
});

describe("socle - ouverture / fermeture par période", () => {
  const { referenceDate, structureIds, activityOptions } =
    FEBRUARY_2025_CLOSURE_FIXTURE;

  const { activeStructureIdsNow, activeStructureIdsByPeriod } =
    buildTestActivityIndex(structureIds, {
      referenceDate,
      ...activityOptions,
    });

  it("expose les structures ouvertes au jour de référence via buildActivityIndex", () => {
    expect(activeStructureIdsNow).toEqual(new Set([1, 2]));
  });

  it("décline une fermeture sur année, mois et trimestre via lookupActiveStructureIds", () => {
    expect(
      lookupActiveStructureIds(activeStructureIdsByPeriod, "year", "2025")
    ).toEqual(new Set([1, 2, 3]));
    expect(
      lookupActiveStructureIds(activeStructureIdsByPeriod, "year", "2026")
    ).toEqual(new Set([1, 2]));

    expect(
      lookupActiveStructureIds(activeStructureIdsByPeriod, "month", "2025-02")
    ).toEqual(new Set([1, 2, 3]));
    expect(
      lookupActiveStructureIds(activeStructureIdsByPeriod, "month", "2025-03")
    ).toEqual(new Set([1, 2]));

    expect(
      lookupActiveStructureIds(
        activeStructureIdsByPeriod,
        "trimester",
        "2025-Q1"
      )
    ).toEqual(new Set([1, 2, 3]));
    expect(
      lookupActiveStructureIds(
        activeStructureIdsByPeriod,
        "trimester",
        "2025-Q2"
      )
    ).toEqual(new Set([1, 2]));
  });

  it("exclut une structure pas encore ouverte au jour de référence", () => {
    const { activeStructureIdsNow: openStructureIds } = buildTestActivityIndex(
      [4],
      {
        referenceDate,
        openingDate: new Date("2025-12-01T00:00:00.000Z"),
        closureDates: new Map([[4, null]]),
      }
    );

    expect(openStructureIds).toEqual(new Set());
  });

  it("exclut une structure déjà fermée avant le jour de référence", () => {
    const { activeStructureIdsNow: openStructureIds } = buildTestActivityIndex(
      [5],
      {
        referenceDate,
        openingDate: new Date("2020-01-01T00:00:00.000Z"),
        closureDates: new Map([[5, new Date("2025-01-01T00:00:00.000Z")]]),
      }
    );

    expect(openStructureIds).toEqual(new Set());
  });
});

describe("socle - périmètre général vs séries temporelles", () => {
  const { structureIds, activityOptions } = FEBRUARY_2025_CLOSURE_FIXTURE;
  const allStructures = structureIds.map((id) => testStructure(id));
  const activeStructureIdsByPeriod = buildTestActivityIndex(structureIds, {
    referenceDate: FEBRUARY_2025_CLOSURE_FIXTURE.referenceDate,
    ...activityOptions,
  }).activeStructureIdsByPeriod;

  it("résout les séries temporelles via structuresActiveInPeriod", () => {
    expect(
      structuresActiveInPeriod(
        allStructures,
        activeStructureIdsByPeriod,
        "year",
        "2025"
      ).map((structure) => structure.id)
    ).toEqual([1, 2, 3]);

    expect(
      structuresActiveInPeriod(
        allStructures,
        activeStructureIdsByPeriod,
        "month",
        "2025-03"
      ).map((structure) => structure.id)
    ).toEqual([1, 2]);
  });

  it("construit le byYear via mapTypologieYears sur le périmètre annuel", () => {
    const byYear = mapTypologieYears(
      allStructures,
      activeStructureIdsByPeriod,
      [
        {
          id: 1,
          structureId: 1,
          year: 2025,
          placesAutorisees: 10,
          pmr: 0,
          lgbt: 0,
          fvvTeh: 0,
        },
        {
          id: 2,
          structureId: 2,
          year: 2025,
          placesAutorisees: 20,
          pmr: 0,
          lgbt: 0,
          fvvTeh: 0,
        },
        {
          id: 3,
          structureId: 3,
          year: 2025,
          placesAutorisees: 30,
          pmr: 0,
          lgbt: 0,
          fvvTeh: 0,
        },
      ],
      (_year, structuresForYear) => ({
        structureIds: structuresForYear.map((structure) => structure.id),
      })
    );

    expect(byYear).toEqual([{ year: 2025, structureIds: [1, 2, 3] }]);
  });
});

describe("socle - version effective et périmètre général", () => {
  const timeline = buildTestStructureVersionTimeline([
    {
      structureId: 1,
      structureVersionId: 10,
      effectiveDate: new Date("2020-01-01T00:00:00.000Z"),
      type: StructureType.CADA,
      departementAdministratif: "01",
    },
    {
      structureId: 1,
      structureVersionId: 11,
      effectiveDate: new Date("2025-01-01T00:00:00.000Z"),
      type: StructureType.CPH,
      departementAdministratif: "75",
    },
  ]);

  const activityWithoutClosure = {
    openingDate: new Date("2020-01-01T00:00:00.000Z"),
    closureDates: new Map<number, Date | null>([[1, null]]),
  };

  it("sélectionne la version effective à la date via getEffectiveStructureVersionAtDate", () => {
    expect(
      getEffectiveStructureVersionAtDate(
        1,
        new Date("2024-06-15T12:00:00.000Z"),
        timeline
      )
    ).toMatchObject({
      id: 10,
      type: StructureType.CADA,
      departementAdministratif: "01",
    });
    expect(
      getEffectiveStructureVersionAtDate(
        1,
        new Date("2025-06-15T12:00:00.000Z"),
        timeline
      )
    ).toMatchObject({
      id: 11,
      type: StructureType.CPH,
      departementAdministratif: "75",
    });
  });

  it("projette la version effective via mapVersionsToStructures", () => {
    const effectiveVersion = getEffectiveStructureVersionAtDate(
      1,
      new Date("2025-06-15T12:00:00.000Z"),
      timeline
    );

    expect(mapVersionsToStructures([effectiveVersion!])).toEqual([
      {
        id: 1,
        type: StructureType.CPH,
        departementAdministratif: "75",
      },
    ]);
  });

  it("forme context.structures comme dans statistique.service (versions + activeStructureIdsNow)", () => {
    const referenceDate = new Date("2025-06-15T12:00:00.000Z");
    const effectiveVersion = getEffectiveStructureVersionAtDate(
      1,
      referenceDate,
      timeline
    );
    const allStructures = mapVersionsToStructures([effectiveVersion!]);
    const { activeStructureIdsNow } = buildTestActivityIndex([1], {
      referenceDate,
      openingDate: new Date("2020-01-01T00:00:00.000Z"),
      closureDates: new Map([[1, new Date("2025-02-01T00:00:00.000Z")]]),
    });

    const structures = allStructures.filter((structure) =>
      activeStructureIdsNow.has(structure.id)
    );

    expect(structures).toEqual([]);
  });

  it("garde la structure au général si fermeture postérieure à la date de référence", () => {
    const referenceDate = new Date("2025-06-15T12:00:00.000Z");
    const effectiveVersion = getEffectiveStructureVersionAtDate(
      1,
      referenceDate,
      timeline
    );
    const allStructures = mapVersionsToStructures([effectiveVersion!]);
    const { activeStructureIdsNow } = buildTestActivityIndex([1], {
      referenceDate,
      ...activityWithoutClosure,
      closureDates: new Map([[1, new Date("2025-12-01T00:00:00.000Z")]]),
    });

    const structures = allStructures.filter((structure) =>
      activeStructureIdsNow.has(structure.id)
    );

    expect(structures).toEqual([
      {
        id: 1,
        type: StructureType.CPH,
        departementAdministratif: "75",
      },
    ]);
  });

  it("combine version antérieure à la transfo et fermeture future", () => {
    const referenceDate = new Date("2024-06-15T12:00:00.000Z");
    const effectiveVersion = getEffectiveStructureVersionAtDate(
      1,
      referenceDate,
      timeline
    );
    const allStructures = mapVersionsToStructures([effectiveVersion!]);
    const { activeStructureIdsNow } = buildTestActivityIndex([1], {
      referenceDate,
      openingDate: new Date("2020-01-01T00:00:00.000Z"),
      closureDates: new Map([[1, new Date("2025-12-01T00:00:00.000Z")]]),
    });

    const structures = allStructures.filter((structure) =>
      activeStructureIdsNow.has(structure.id)
    );

    expect(structures).toEqual([
      {
        id: 1,
        type: StructureType.CADA,
        departementAdministratif: "01",
      },
    ]);
  });
});

describe("socle - résolution DNA à date", () => {
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
    {
      structureId: 2,
      structureVersionId: 20,
      effectiveDate: new Date("2025-01-01T00:00:00.000Z"),
      type: StructureType.CAES,
    },
  ]);

  const dnaLinks = buildTestDnaLinks([
    { structureId: 1, structureVersionId: 10, dnaCode: "DNA-SHARED" },
    { structureId: 2, structureVersionId: 20, dnaCode: "DNA-SHARED" },
    { structureId: 1, structureVersionId: 10, dnaCode: "DNA-OLD" },
  ]);

  it("rattache un DNA via lookupStructureIdsForDnaAtDate sur la version effective", () => {
    expect(
      lookupStructureIdsForDnaAtDate(
        "DNA-SHARED",
        new Date("2024-06-01"),
        dnaLinks,
        timeline
      )
    ).toEqual([1]);
    expect(
      lookupStructureIdsForDnaAtDate(
        "DNA-SHARED",
        new Date("2025-06-01"),
        dnaLinks,
        timeline
      )
    ).toEqual([2]);
    expect(
      lookupStructureIdsForDnaAtDate(
        "DNA-OLD",
        new Date("2025-06-01"),
        dnaLinks,
        timeline
      )
    ).toEqual([]);
  });

  it("restreint lookupStructureIdsForDnaAtDate au Set de structures actives fourni", () => {
    expect(
      lookupStructureIdsForDnaAtDate(
        "DNA-SHARED",
        new Date("2025-06-01"),
        dnaLinks,
        timeline,
        new Set([1])
      )
    ).toEqual([]);
  });
});

describe("matchesStatistiquesPerimeterFilters - filtres appliqués sur la version déjà résolue", () => {
  const noFilters: StatistiquesResolvedPerimeterFilters = {
    departements: null,
    types: new Set(),
    operateurIds: null,
  };

  const version = (
    overrides: Partial<{
      type: string | null;
      departementAdministratif: string | null;
      operateurId: number | null;
    }> = {}
  ) => ({
    departementAdministratif: overrides.departementAdministratif ?? "01",
    structure: {
      operateurId: overrides.operateurId === undefined ? 1 : overrides.operateurId,
      type: overrides.type === undefined ? StructureType.CADA : overrides.type,
    },
  });

  it("accepte une version valide sans filtre", () => {
    expect(matchesStatistiquesPerimeterFilters(version(), noFilters)).toBe(
      true
    );
  });

  it("rejette un type exclu du périmètre (PRAHDA) même sans filtre de type", () => {
    expect(
      matchesStatistiquesPerimeterFilters(
        version({ type: StructureType.PRAHDA }),
        noFilters
      )
    ).toBe(false);
  });

  it("rejette une version sans type", () => {
    expect(
      matchesStatistiquesPerimeterFilters(version({ type: null }), noFilters)
    ).toBe(false);
  });

  it("filtre par type", () => {
    const filters = { ...noFilters, types: new Set([StructureType.CPH]) };
    expect(
      matchesStatistiquesPerimeterFilters(
        version({ type: StructureType.CADA }),
        filters
      )
    ).toBe(false);
    expect(
      matchesStatistiquesPerimeterFilters(
        version({ type: StructureType.CPH }),
        filters
      )
    ).toBe(true);
  });

  it("compare le filtre département à l'état résolu (courant), pas à un ancien état", () => {
    // Régression : une structure transformée du département 01 vers 02 ne doit
    // plus matcher un filtre "01", même si son ancienne version matchait.
    const filters = { ...noFilters, departements: new Set(["01"]) };
    const currentVersion = version({ departementAdministratif: "02" });

    expect(matchesStatistiquesPerimeterFilters(currentVersion, filters)).toBe(
      false
    );
    expect(
      matchesStatistiquesPerimeterFilters(
        version({ departementAdministratif: "01" }),
        filters
      )
    ).toBe(true);
  });

  it("filtre par opérateur (filiales déjà résolues en amont)", () => {
    const filters = { ...noFilters, operateurIds: new Set([10, 11]) };
    expect(
      matchesStatistiquesPerimeterFilters(version({ operateurId: 99 }), filters)
    ).toBe(false);
    expect(
      matchesStatistiquesPerimeterFilters(version({ operateurId: 10 }), filters)
    ).toBe(true);
    expect(
      matchesStatistiquesPerimeterFilters(version({ operateurId: null }), filters)
    ).toBe(false);
  });
});

describe("filterByActiveStructureId", () => {
  it("ne garde que les lignes dont le structureId est dans le périmètre actif", () => {
    const rows = [
      { structureId: 1, value: "a" },
      { structureId: 2, value: "b" },
      { structureId: 3, value: "c" },
    ];

    expect(filterByActiveStructureId(rows, new Set([1, 3]))).toEqual([
      { structureId: 1, value: "a" },
      { structureId: 3, value: "c" },
    ]);
  });

  it("exclut les lignes sans structureId", () => {
    const rows = [
      { structureId: null, value: "orphan" },
      { structureId: 1, value: "a" },
    ];

    expect(filterByActiveStructureId(rows, new Set([1]))).toEqual([
      { structureId: 1, value: "a" },
    ]);
  });
});
