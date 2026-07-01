import { startOfNextUtcDay, startOfUtcDay } from "@/app/utils/date.util";
import { sumValues } from "@/app/utils/math.util";
import { EXCLUDED_STRUCTURE_TYPES } from "@/constants";

import type {
  StatistiqueDbDnaLink,
  StatistiqueDbEffectiveStructureVersion,
  StatistiqueDbStructure,
  StatistiqueDbStructureActivity,
  StatistiqueDbStructureVersionTimeline,
  StatistiqueDbTypologie,
  StatistiqueDbTypologieValues,
  StatistiquesActiveStructureIdsByPeriod,
  StatistiquesActivityContext,
  StatistiquesPeriodGranularity,
} from "./statistiques.db.type";

export const createEmptyActiveStructureIdsByPeriod =
  (): StatistiquesActiveStructureIdsByPeriod => ({
    month: new Map(),
    trimester: new Map(),
    year: new Map(),
  });

const excludedStructureTypes = new Set<string>(EXCLUDED_STRUCTURE_TYPES);

export type StatistiquesResolvedPerimeterFilters = {
  departements: Set<string> | null;
  types: Set<string>;
  operateurIds: Set<number> | null;
};

export type StatistiquesResolvableStructureVersion = {
  type: string | null;
  departementAdministratif: string | null;
  structure: { operateurId: number | null } | null;
};

/**
 * Applique les filtres (département/type/opérateur) sur une version déjà résolue
 * comme "effective" (par ex. la version la plus récente finalisée).
 */
export const matchesStatistiquesPerimeterFilters = (
  version: StatistiquesResolvableStructureVersion,
  resolved: StatistiquesResolvedPerimeterFilters
): boolean => {
  if (version.type == null || excludedStructureTypes.has(version.type)) {
    return false;
  }
  if (resolved.types.size > 0 && !resolved.types.has(version.type)) {
    return false;
  }
  if (
    resolved.departements &&
    (version.departementAdministratif == null ||
      !resolved.departements.has(version.departementAdministratif))
  ) {
    return false;
  }
  if (
    resolved.operateurIds &&
    (version.structure?.operateurId == null ||
      !resolved.operateurIds.has(version.structure.operateurId))
  ) {
    return false;
  }
  return true;
};

const yearFromDate = (
  date: Date | string | null | undefined
): number | null => {
  if (date == null) {
    return null;
  }
  return new Date(date).getFullYear();
};

export const mapVersionsToStructures = (
  versions: StatistiqueDbEffectiveStructureVersion[]
): StatistiqueDbStructure[] =>
  versions
    .filter(
      (version): version is typeof version & { structureId: number } =>
        version.structureId != null
    )
    .map((version) => ({
      id: version.structureId,
      type: version.type,
      departementAdministratif: version.departementAdministratif,
    }));

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
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
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
): StatistiqueDbEffectiveStructureVersion | null => {
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

export const computeTotalPlaces = (
  structures: StatistiqueDbStructure[],
  typologieMap: Map<number, StatistiqueDbTypologieValues>
): number =>
  sumValues(
    structures.map(
      (structure) => typologieMap.get(structure.id)?.placesAutorisees
    )
  ) ?? 0;
