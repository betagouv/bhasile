import { describe, expect, it } from "vitest";

import type { StatistiqueDbStructure } from "@/app/api/statistiques/statistiques.db.type";
import {
  filterByActiveStructureId,
  getEffectiveStructureVersionAtDate,
  lookupActiveStructureIds,
  lookupStructureIdsForDnaAtDate,
  mapTypologieYears,
  parseStatistiquesPerimeterFilters,
  sliceStatistiquesContext,
  structuresActiveInPeriod,
} from "@/app/api/statistiques/statistiques.utils";
import { StructureType } from "@/types/structure.type";

import {
  buildTestActivityIndex,
  buildTestDnaLinks,
  buildTestStatistiquesContext,
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

describe("socle - version effective à date (résolution adresses/typologies/DNA)", () => {
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

  it("sélectionne la version effective à la date via getEffectiveStructureVersionAtDate", () => {
    expect(
      getEffectiveStructureVersionAtDate(
        1,
        new Date("2024-06-15T12:00:00.000Z"),
        timeline
      )
    ).toMatchObject({ id: 10 });
    expect(
      getEffectiveStructureVersionAtDate(
        1,
        new Date("2025-06-15T12:00:00.000Z"),
        timeline
      )
    ).toMatchObject({ id: 11 });
  });

  it("retourne null avant la première version effective", () => {
    expect(
      getEffectiveStructureVersionAtDate(
        1,
        new Date("2019-06-15T12:00:00.000Z"),
        timeline
      )
    ).toBeNull();
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

describe("parseStatistiquesPerimeterFilters - résolution des filtres scalaires", () => {
  const filters = (
    overrides: Partial<{
      departements: string | null;
      operateurs: string | null;
      types: string | null;
    }> = {}
  ) => ({
    departements: overrides.departements ?? null,
    operateurs: overrides.operateurs ?? null,
    types: overrides.types ?? null,
    aggregation: "moyenne" as const,
  });

  it("retient tous les types non exclus quand aucun filtre de type n'est fourni", () => {
    const { types } = parseStatistiquesPerimeterFilters(filters());
    expect(types.has(StructureType.CADA)).toBe(true);
    expect(types.has(StructureType.HUDA)).toBe(true);
    expect(types.has(StructureType.PRAHDA)).toBe(false);
  });

  it("restreint aux types demandés, exclus retirés", () => {
    const { types } = parseStatistiquesPerimeterFilters(
      filters({ types: "CPH,PRAHDA" })
    );
    expect([...types]).toEqual([StructureType.CPH]);
  });

  it("parse départements et opérateurs, null quand absents", () => {
    const empty = parseStatistiquesPerimeterFilters(filters());
    expect(empty.departements).toBeNull();
    expect(empty.operateurIds).toEqual([]);

    const parsed = parseStatistiquesPerimeterFilters(
      filters({ departements: "01,02", operateurs: "10,11" })
    );
    expect(parsed.departements).toEqual(new Set(["01", "02"]));
    expect(parsed.operateurIds).toEqual([10, 11]);
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

describe("sliceStatistiquesContext - restriction à une zone", () => {
  const structure1 = { id: 1, type: StructureType.CADA, departementAdministratif: "01" };
  const structure2 = { id: 2, type: StructureType.CADA, departementAdministratif: "02" };

  const { activeStructureIdsNow, activeStructureIdsByPeriod } =
    buildTestActivityIndex([1, 2], {
      referenceDate: new Date("2025-06-15T12:00:00.000Z"),
      periodDates: [new Date("2025-03-15T00:00:00.000Z")],
    });

  const context = buildTestStatistiquesContext({
    structures: [structure1, structure2],
    allStructures: [structure1, structure2],
    activeStructureIdsNow,
    activeStructureIdsByPeriod,
    typologies: [],
    adresses: [],
    departements: [
      { id: 1, numero: "01", name: "Département 01", population: 100 },
      { id: 2, numero: "02", name: "Département 02", population: 200 },
    ],
  });

  const sliced = sliceStatistiquesContext(
    context,
    new Set([1]),
    new Set(["01"])
  );

  it("ne garde que les structures de la zone dans structures et allStructures", () => {
    expect(sliced.structures).toEqual([structure1]);
    expect(sliced.allStructures).toEqual([structure1]);
  });

  it("restreint activeStructureIdsNow à la zone", () => {
    expect(sliced.activeStructureIdsNow).toEqual(new Set([1]));
  });

  it("restreint chaque Set de activeStructureIdsByPeriod à la zone, sans perdre les clés de période", () => {
    expect([...sliced.activeStructureIdsByPeriod.year.keys()]).toEqual(
      [...context.activeStructureIdsByPeriod.year.keys()]
    );
    for (const ids of sliced.activeStructureIdsByPeriod.year.values()) {
      expect(ids).toEqual(new Set([1]));
    }
  });

  it("ne garde que les départements de la zone", () => {
    expect(sliced.departements).toEqual([
      { id: 1, numero: "01", name: "Département 01", population: 100 },
    ]);
  });

  it("ne modifie pas le contexte d'origine", () => {
    expect(context.structures).toEqual([structure1, structure2]);
    expect(context.departements).toHaveLength(2);
  });
});
