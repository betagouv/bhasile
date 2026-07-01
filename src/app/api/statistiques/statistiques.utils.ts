import { startOfNextUtcDay, startOfUtcDay } from "@/app/utils/date.util";
import { sumValues } from "@/app/utils/math.util";
import { EXCLUDED_STRUCTURE_TYPES } from "@/constants";
import { StructureType } from "@/generated/prisma/client";
import type { StatistiquesFilters } from "@/schemas/api/statistique.schema";

import type {
  StatistiqueDbDnaLink,
  StatistiqueDbStructure,
  StatistiqueDbStructureActivity,
  StatistiqueDbStructureVersionTimeline,
  StatistiqueDbTypologie,
  StatistiqueDbTypologieValues,
  StatistiquesActiveStructureIdsByPeriod,
  StatistiquesActivityContext,
  StatistiquesContext,
  StatistiquesPeriodGranularity,
} from "./statistiques.db.type";

export const createEmptyActiveStructureIdsByPeriod =
  (): StatistiquesActiveStructureIdsByPeriod => ({
    month: new Map(),
    trimester: new Map(),
    year: new Map(),
  });

const excludedStructureTypes = new Set<string>(EXCLUDED_STRUCTURE_TYPES);

/** Types de structures retenus par défaut dans les stats (tous sauf exclus). */
const NON_EXCLUDED_STRUCTURE_TYPES: StructureType[] = Object.values(
  StructureType
).filter((type) => !excludedStructureTypes.has(type));

export type StatistiquesResolvedPerimeterFilters = {
  departements: Set<string> | null;
  types: Set<StructureType>;
  operateurIds: Set<number> | null;
};

/** Filtres parsés mais pas encore résolus : les filiales des `operateurIds` ne sont pas encore ajoutées (accès BDD, cf. service). */
export type StatistiquesParsedPerimeterFilters = {
  departements: Set<string> | null;
  types: Set<StructureType>;
  operateurIds: number[];
};

export const parseStatistiquesPerimeterFilters = (
  filters: StatistiquesFilters
): StatistiquesParsedPerimeterFilters => {
  const depList = filters.departements?.split(",").filter(Boolean) ?? [];
  const requestedTypes = new Set(
    filters.types?.split(",").filter(Boolean) ?? []
  );
  const types = new Set(
    NON_EXCLUDED_STRUCTURE_TYPES.filter(
      (type) => requestedTypes.size === 0 || requestedTypes.has(type)
    )
  );
  const operateurIds =
    filters.operateurs?.split(",").filter(Boolean).map(Number) ?? [];

  return {
    departements: depList.length > 0 ? new Set(depList) : null,
    types,
    operateurIds,
  };
};

const yearFromDate = (
  date: Date | string | null | undefined
): number | null => {
  if (date == null) {
    return null;
  }
  return new Date(date).getUTCFullYear();
};

export const buildStatistiquesActivityContext = (
  structureIds: number[],
  structureActivityDates: StatistiqueDbStructureActivity[]
): StatistiquesActivityContext => {
  const openingDateByStructureId = new Map<number, Date>();
  const closureDateByStructureId = new Map<number, Date | null>();

  for (const structure of structureActivityDates) {
    if (structure.creationDate != null) {
      openingDateByStructureId.set(
        structure.id,
        new Date(structure.creationDate)
      );
    }
    closureDateByStructureId.set(
      structure.id,
      structure.fermetureDate != null ? new Date(structure.fermetureDate) : null
    );
  }

  return {
    allStructureIds: structureIds,
    openingDateByStructureId,
    closureDateByStructureId,
  };
};

const isStructureActiveInPeriod = (
  structureId: number,
  periodStart: Date,
  periodEnd: Date,
  activityContext: StatistiquesActivityContext
): boolean => {
  const openingDate = activityContext.openingDateByStructureId.get(structureId);
  if (openingDate != null && openingDate >= periodEnd) {
    return false;
  }

  const closureDate =
    activityContext.closureDateByStructureId.get(structureId) ?? null;
  if (closureDate != null && closureDate < periodStart) {
    return false;
  }

  return true;
};

export const toMonthKey = (date: Date): string =>
  date.toISOString().slice(0, 7);

export const toYearKey = (date: Date): string => date.toISOString().slice(0, 4);

export const toTrimesterKey = (date: Date): string => {
  const month = Number(date.toISOString().slice(5, 7));
  const year = date.toISOString().slice(0, 4);
  return `${year}-Q${Math.ceil(month / 3)}`;
};

export const parseTrimesterKey = (
  trimesterKey: string
): { year: number; trimester: number } => {
  const [year, trimesterPart] = trimesterKey.split("-Q");
  return { year: Number(year), trimester: Number(trimesterPart) };
};

export const monthKeyToDate = (monthKey: string): Date =>
  new Date(`${monthKey}-01`);

export const trimesterKeyToDate = (trimesterKey: string): Date =>
  getPeriodBounds("trimester", trimesterKey).start;

export const yearKeyToDate = (yearKey: string): Date =>
  new Date(Date.UTC(Number(yearKey), 0, 1));

export const endOfYearUtc = (year: number): Date =>
  new Date(Date.UTC(year, 11, 31));

const getMonthPeriodBounds = (monthKey: string): { start: Date; end: Date } => {
  const [year, month] = monthKey.split("-").map(Number);
  return {
    start: new Date(Date.UTC(year, month - 1, 1)),
    end: new Date(Date.UTC(year, month, 1)),
  };
};

const getTrimesterPeriodBounds = (
  year: number,
  trimester: number
): { start: Date; end: Date } => {
  const startMonth = (trimester - 1) * 3;
  return {
    start: new Date(Date.UTC(year, startMonth, 1)),
    end: new Date(Date.UTC(year, startMonth + 3, 1)),
  };
};

export const getPeriodBounds = (
  granularity: StatistiquesPeriodGranularity,
  periodKey: string
): { start: Date; end: Date } => {
  switch (granularity) {
    case "month":
      return getMonthPeriodBounds(periodKey);
    case "trimester": {
      const { year, trimester } = parseTrimesterKey(periodKey);
      return getTrimesterPeriodBounds(year, trimester);
    }
    case "year":
      return {
        start: new Date(Date.UTC(Number(periodKey), 0, 1)),
        end: new Date(Date.UTC(Number(periodKey) + 1, 0, 1)),
      };
  }
};

export const filterByTwelveMonthWindow = <Item>(
  items: Item[],
  getDate: (item: Item) => Date | string | null | undefined
): Item[] => {
  const twelveMonthsAgo = startOfUtcDay();
  twelveMonthsAgo.setUTCMonth(twelveMonthsAgo.getUTCMonth() - 12);
  const cutoff = toMonthKey(twelveMonthsAgo);

  return items.filter((item) => {
    const date = getDate(item);
    if (date == null) {
      return false;
    }
    return toMonthKey(new Date(date)) >= cutoff;
  });
};

export const getEffectiveStructureVersionAtDate = (
  structureId: number,
  date: Date,
  timeline: StatistiqueDbStructureVersionTimeline[]
): StatistiqueDbStructureVersionTimeline | null => {
  const cutoff = startOfNextUtcDay(date);
  let effectiveVersion: StatistiqueDbStructureVersionTimeline | null = null;

  for (const version of timeline) {
    if (version.structureId !== structureId) {
      continue;
    }
    if (version.effectiveDate == null || version.effectiveDate >= cutoff) {
      continue;
    }
    if (effectiveVersion == null || effectiveVersion.effectiveDate == null) {
      effectiveVersion = version;
      continue;
    }
    if (
      version.effectiveDate > effectiveVersion.effectiveDate ||
      (version.effectiveDate.getTime() ===
        effectiveVersion.effectiveDate.getTime() &&
        version.id > effectiveVersion.id)
    ) {
      effectiveVersion = version;
    }
  }

  return effectiveVersion;
};

/**
 * Ne garde que les lignes (adresses, typologies, …) rattachées à la
 * StructureVersion effective de leur structure à `date` (plafonnée à `now`
 * pour ne jamais anticiper une version pas encore effective). Généralise le
 * pivot déjà utilisé pour les liens DNA (`lookupStructureIdsForDnaAtDate`) à
 * n'importe quelle donnée rattachée à une `structureVersionId`.
 */
export const filterByEffectiveVersionAtDate = <
  Row extends { structureId: number; structureVersionId: number | null },
>(
  rows: Row[],
  structureIds: Iterable<number>,
  date: Date,
  timeline: StatistiqueDbStructureVersionTimeline[],
  now: Date = new Date()
): Row[] => {
  const cappedDate = date < now ? date : now;
  const effectiveVersionIdByStructureId = new Map<number, number>();

  for (const structureId of structureIds) {
    const effectiveVersion = getEffectiveStructureVersionAtDate(
      structureId,
      cappedDate,
      timeline
    );
    if (effectiveVersion?.id != null) {
      effectiveVersionIdByStructureId.set(structureId, effectiveVersion.id);
    }
  }

  return rows.filter(
    (row) =>
      effectiveVersionIdByStructureId.get(row.structureId) ===
      row.structureVersionId
  );
};

export const lookupStructureIdsForDnaAtDate = (
  dnaCode: string,
  date: Date,
  dnaLinks: StatistiqueDbDnaLink[],
  timeline: StatistiqueDbStructureVersionTimeline[],
  activeStructureIds?: Set<number>
): number[] => {
  const structureIds = new Set<number>();

  for (const link of dnaLinks) {
    if (link.dna.code !== dnaCode || link.structureId === null) {
      continue;
    }
    const structureId = link.structureId;
    const effectiveVersion = getEffectiveStructureVersionAtDate(
      structureId,
      date,
      timeline
    );
    if (effectiveVersion?.id !== link.structureVersionId) {
      continue;
    }
    if (activeStructureIds && !activeStructureIds.has(structureId)) {
      continue;
    }
    structureIds.add(structureId);
  }

  return [...structureIds];
};

/** Structures ouvertes à un instant (jour UTC de référence). */
const getActiveStructureIdsAtDate = (
  activityContext: StatistiquesActivityContext,
  date: Date
): Set<number> =>
  computeActiveStructureIdsForBounds(
    activityContext,
    startOfUtcDay(date),
    startOfNextUtcDay(date)
  );

const computeActiveStructureIdsForBounds = (
  activityContext: StatistiquesActivityContext,
  periodStart: Date,
  periodEnd: Date
): Set<number> => {
  const activeStructureIds = new Set<number>();

  for (const structureId of activityContext.allStructureIds) {
    if (
      isStructureActiveInPeriod(
        structureId,
        periodStart,
        periodEnd,
        activityContext
      )
    ) {
      activeStructureIds.add(structureId);
    }
  }

  return activeStructureIds;
};

const indexActiveStructureIds = (
  activityContext: StatistiquesActivityContext,
  activeStructureIdsByPeriod: StatistiquesActiveStructureIdsByPeriod,
  granularity: StatistiquesPeriodGranularity,
  periodKeys: Iterable<string>
): void => {
  const index = activeStructureIdsByPeriod[granularity];

  for (const periodKey of periodKeys) {
    if (index.has(periodKey)) {
      continue;
    }

    const { start, end } = getPeriodBounds(granularity, periodKey);
    index.set(
      periodKey,
      computeActiveStructureIdsForBounds(activityContext, start, end)
    );
  }
};

export const lookupActiveStructureIds = (
  activeStructureIdsByPeriod: StatistiquesActiveStructureIdsByPeriod,
  granularity: StatistiquesPeriodGranularity,
  periodKey: string
): Set<number> =>
  activeStructureIdsByPeriod[granularity].get(periodKey) ?? new Set();

export const structuresActiveInPeriod = (
  structures: StatistiqueDbStructure[],
  activeStructureIdsByPeriod: StatistiquesActiveStructureIdsByPeriod,
  granularity: StatistiquesPeriodGranularity,
  periodKey: string
): StatistiqueDbStructure[] => {
  const activeIds = lookupActiveStructureIds(
    activeStructureIdsByPeriod,
    granularity,
    periodKey
  );
  return structures.filter((structure) => activeIds.has(structure.id));
};

/** Ne garde que les lignes dont le `structureId` (nullable) est dans le périmètre actif. */
export const filterByActiveStructureId = <
  Item extends { structureId: number | null },
>(
  items: Item[],
  activeStructureIds: Set<number>
): (Item & { structureId: number })[] =>
  items.filter(
    (item): item is Item & { structureId: number } =>
      item.structureId != null && activeStructureIds.has(item.structureId)
  );

export const groupByPeriodKey = <Item>(
  items: Item[],
  getDate: (item: Item) => Date | null | undefined,
  getPeriodKey: (date: Date) => string
): Map<string, Item[]> => {
  const byPeriod = new Map<string, Item[]>();

  for (const item of items) {
    const date = getDate(item);
    if (!date) {
      continue;
    }
    const periodKey = getPeriodKey(date);
    const bucket = byPeriod.get(periodKey) ?? [];
    bucket.push(item);
    byPeriod.set(periodKey, bucket);
  }

  return byPeriod;
};

export const collectDistinctYears = (...rows: { year: number }[][]): number[] =>
  [...new Set(rows.flat().map((row) => row.year))].sort(
    (yearA, yearB) => yearA - yearB
  );

const collectActivityYearKeys = (
  structureIds: number[],
  typologieYears: number[],
  openingDateByStructureId: Map<number, Date>,
  closureDateByStructureId: Map<number, Date | null>,
  referenceYear: number
): string[] => {
  const years = new Set(typologieYears);

  for (const structureId of structureIds) {
    const openingYear = Math.min(
      yearFromDate(openingDateByStructureId.get(structureId)) ?? referenceYear,
      referenceYear
    );
    const closureYear = Math.min(
      yearFromDate(closureDateByStructureId.get(structureId) ?? null) ??
        referenceYear,
      referenceYear
    );

    for (
      let year = Math.min(openingYear, closureYear);
      year <= referenceYear;
      year += 1
    ) {
      years.add(year);
    }
  }

  return [...years].sort((yearA, yearB) => yearA - yearB).map(String);
};

const indexActiveStructureIdsFromDates = (
  activityContext: StatistiquesActivityContext,
  activeStructureIdsByPeriod: StatistiquesActiveStructureIdsByPeriod,
  dates: (Date | string | null | undefined)[],
  granularities: StatistiquesPeriodGranularity[]
): void => {
  const keys: Record<StatistiquesPeriodGranularity, Set<string>> = {
    month: new Set(),
    trimester: new Set(),
    year: new Set(),
  };

  for (const date of dates) {
    if (date == null) {
      continue;
    }
    const parsedDate = new Date(date);
    if (granularities.includes("month")) {
      keys.month.add(toMonthKey(parsedDate));
    }
    if (granularities.includes("trimester")) {
      keys.trimester.add(toTrimesterKey(parsedDate));
    }
    if (granularities.includes("year")) {
      keys.year.add(toYearKey(parsedDate));
    }
  }

  for (const granularity of granularities) {
    indexActiveStructureIds(
      activityContext,
      activeStructureIdsByPeriod,
      granularity,
      [...keys[granularity]].sort()
    );
  }
};

export const buildActivityIndex = (
  activityContext: StatistiquesActivityContext,
  activeStructureIdsByPeriod: StatistiquesActiveStructureIdsByPeriod,
  params: {
    referenceDate: Date;
    typologieYears: number[];
    referenceYear: number;
    periodDates: (Date | string | null | undefined)[];
    financeYears?: number[];
  }
): Set<number> => {
  indexActiveStructureIds(
    activityContext,
    activeStructureIdsByPeriod,
    "year",
    collectActivityYearKeys(
      activityContext.allStructureIds,
      params.typologieYears,
      activityContext.openingDateByStructureId,
      activityContext.closureDateByStructureId,
      params.referenceYear
    )
  );

  if (params.financeYears?.length) {
    indexActiveStructureIds(
      activityContext,
      activeStructureIdsByPeriod,
      "year",
      params.financeYears.map(String)
    );
  }

  indexActiveStructureIdsFromDates(
    activityContext,
    activeStructureIdsByPeriod,
    [params.referenceDate, ...params.periodDates],
    ["month", "trimester", "year"]
  );

  return getActiveStructureIdsAtDate(activityContext, params.referenceDate);
};

const TYPOLOGIE_AGGREGATE_FIELDS = [
  "placesAutorisees",
  "pmr",
  "lgbt",
  "fvvTeh",
] as const satisfies readonly (keyof StatistiqueDbTypologieValues)[];

// Dernière valeur non nulle par champ et par structure (agrégat global).
export const getLastTypologiePerStructure = (
  typologies: StatistiqueDbTypologie[]
): Map<number, StatistiqueDbTypologieValues> => {
  const byStructure = new Map<number, StatistiqueDbTypologie[]>();

  for (const typologie of typologies) {
    if (typologie.structureId === null) {
      continue;
    }
    const rows = byStructure.get(typologie.structureId) ?? [];
    rows.push(typologie);
    byStructure.set(typologie.structureId, rows);
  }

  const typologieByStructureId = new Map<
    number,
    StatistiqueDbTypologieValues
  >();

  for (const [structureId, rows] of byStructure) {
    const resolved: StatistiqueDbTypologieValues = {
      structureId,
      year: rows[rows.length - 1].year,
      placesAutorisees: null,
      pmr: null,
      lgbt: null,
      fvvTeh: null,
    };

    for (let rowIndex = rows.length - 1; rowIndex >= 0; rowIndex -= 1) {
      const typologieRow = rows[rowIndex];
      for (const field of TYPOLOGIE_AGGREGATE_FIELDS) {
        if (resolved[field] == null && typologieRow[field] != null) {
          resolved[field] = typologieRow[field];
          if (field === "placesAutorisees") {
            resolved.year = typologieRow.year;
          }
        }
      }
    }

    typologieByStructureId.set(structureId, resolved);
  }

  return typologieByStructureId;
};

// Typologies remontées pour un millésime donné uniquement.
export const getTypologieMapForExactYear = (
  typologies: StatistiqueDbTypologie[],
  year: number
): Map<number, StatistiqueDbTypologieValues> => {
  const typologieByStructureId = new Map<
    number,
    StatistiqueDbTypologieValues
  >();
  for (const typologie of typologies) {
    if (typologie.year === year && typologie.structureId !== null) {
      typologieByStructureId.set(typologie.structureId, typologie);
    }
  }
  return typologieByStructureId;
};

export const getTypologieYears = (
  typologies: StatistiqueDbTypologie[]
): number[] =>
  [...new Set(typologies.map((typologie) => typologie.year))].sort(
    (yearA, yearB) => yearA - yearB
  );

export const mapTypologieYears = <Entry extends { year: number }>(
  allStructures: StatistiqueDbStructure[],
  activeStructureIdsByPeriod: StatistiquesActiveStructureIdsByPeriod,
  typologies: StatistiqueDbTypologie[],
  buildEntry: (
    year: number,
    structuresForYear: StatistiqueDbStructure[]
  ) => Omit<Entry, "year">
): Entry[] =>
  getTypologieYears(typologies).map((year) => ({
    year,
    ...buildEntry(
      year,
      structuresActiveInPeriod(
        allStructures,
        activeStructureIdsByPeriod,
        "year",
        String(year)
      )
    ),
  })) as Entry[];

export const filterStructuresWithTypologie = (
  structures: StatistiqueDbStructure[],
  typologieMap: Map<number, StatistiqueDbTypologieValues>
): StatistiqueDbStructure[] =>
  structures.filter((structure) => typologieMap.has(structure.id));

/** Shared prologue for the cartographie one-year indicator computers: null when the year has no typologie data. */
export const resolveStructuresWithTypologieForYear = (
  context: Pick<
    StatistiquesContext,
    "allStructures" | "activeStructureIdsByPeriod" | "typologies"
  >,
  year: number
): {
  structures: StatistiqueDbStructure[];
  typologieMap: Map<number, StatistiqueDbTypologieValues>;
} | null => {
  if (!getTypologieYears(context.typologies).includes(year)) {
    return null;
  }

  const typologieMap = getTypologieMapForExactYear(context.typologies, year);
  const structuresForYear = structuresActiveInPeriod(
    context.allStructures,
    context.activeStructureIdsByPeriod,
    "year",
    String(year)
  );

  return {
    structures: filterStructuresWithTypologie(structuresForYear, typologieMap),
    typologieMap,
  };
};

export const computeTotalPlaces = (
  structures: StatistiqueDbStructure[],
  typologieMap: Map<number, StatistiqueDbTypologieValues>
): number =>
  sumValues(
    structures.map(
      (structure) => typologieMap.get(structure.id)?.placesAutorisees
    )
  ) ?? 0;

const intersectStructureIds = (
  ids: Iterable<number>,
  structureIdsInZone: Set<number>
): Set<number> =>
  new Set([...ids].filter((id) => structureIdsInZone.has(id)));

const sliceActiveStructureIdsByPeriod = (
  byPeriod: StatistiquesActiveStructureIdsByPeriod,
  structureIdsInZone: Set<number>
): StatistiquesActiveStructureIdsByPeriod => ({
  month: new Map(
    [...byPeriod.month].map(([periodKey, ids]) => [
      periodKey,
      intersectStructureIds(ids, structureIdsInZone),
    ])
  ),
  trimester: new Map(
    [...byPeriod.trimester].map(([periodKey, ids]) => [
      periodKey,
      intersectStructureIds(ids, structureIdsInZone),
    ])
  ),
  year: new Map(
    [...byPeriod.year].map(([periodKey, ids]) => [
      periodKey,
      intersectStructureIds(ids, structureIdsInZone),
    ])
  ),
});

/** Restricts an already-loaded StatistiquesContext to a zone's structures, without refetching. */
export const sliceStatistiquesContext = (
  context: StatistiquesContext,
  structureIdsInZone: Set<number>,
  departementNumerosInZone: Set<string>
): StatistiquesContext => ({
  ...context,
  structures: context.structures.filter((structure) =>
    structureIdsInZone.has(structure.id)
  ),
  allStructures: context.allStructures.filter((structure) =>
    structureIdsInZone.has(structure.id)
  ),
  activeStructureIdsNow: intersectStructureIds(
    context.activeStructureIdsNow,
    structureIdsInZone
  ),
  activeStructureIdsByPeriod: sliceActiveStructureIdsByPeriod(
    context.activeStructureIdsByPeriod,
    structureIdsInZone
  ),
  departements: context.departements.filter((departement) =>
    departementNumerosInZone.has(departement.numero)
  ),
});
