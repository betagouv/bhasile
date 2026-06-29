import { sumValues } from "@/app/utils/math.util";

import type {
  StatistiqueDbEffectiveStructureVersion,
  StatistiqueDbStructure,
  StatistiqueDbTypologie,
  StatistiqueDbTypologieValues,
  StatistiquesYearContext,
} from "./statistiques.db.type";

export const getYearFromDate = (
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

export const buildClosureDateByStructureId = (
  effectiveVersions: StatistiqueDbEffectiveStructureVersion[]
): Map<number, Date | null> => {
  const closureDateByStructureId = new Map<number, Date | null>();

  for (const version of effectiveVersions) {
    if (version.structureId == null) {
      continue;
    }

    if (version.structureVersionTransformation?.type === "FERMETURE") {
      closureDateByStructureId.set(
        version.structureId,
        version.effectiveDate != null ? new Date(version.effectiveDate) : null
      );
      continue;
    }

    closureDateByStructureId.set(version.structureId, null);
  }

  return closureDateByStructureId;
};

export const isStructureActiveInPeriod = (
  structureId: number,
  periodStart: Date,
  periodEnd: Date,
  yearContext: StatistiquesYearContext
): boolean => {
  const openingDate = yearContext.openingDateByStructureId.get(structureId);
  if (openingDate != null && openingDate >= periodEnd) {
    return false;
  }

  const closureDate = yearContext.closureDateByStructureId.get(structureId) ?? null;
  if (closureDate != null && closureDate < periodStart) {
    return false;
  }

  return true;
};

export const getYearPeriodBounds = (year: number): { start: Date; end: Date } => ({
  start: new Date(Date.UTC(year, 0, 1)),
  end: new Date(Date.UTC(year + 1, 0, 1)),
});

export const getMonthPeriodBounds = (
  monthKey: string
): { start: Date; end: Date } => {
  const [year, month] = monthKey.split("-").map(Number);
  return {
    start: new Date(Date.UTC(year, month - 1, 1)),
    end: new Date(Date.UTC(year, month, 1)),
  };
};

export const getTrimesterPeriodBounds = (
  year: number,
  trimester: number
): { start: Date; end: Date } => {
  const startMonth = (trimester - 1) * 3;
  return {
    start: new Date(Date.UTC(year, startMonth, 1)),
    end: new Date(Date.UTC(year, startMonth + 3, 1)),
  };
};

export const isStructureActiveInYear = (
  structureId: number,
  year: number,
  yearContext: StatistiquesYearContext
): boolean => {
  const { start, end } = getYearPeriodBounds(year);
  return isStructureActiveInPeriod(structureId, start, end, yearContext);
};

export const collectCandidateYears = (
  structureIds: number[],
  typologieYears: number[],
  openingDateByStructureId: Map<number, Date>,
  closureDateByStructureId: Map<number, Date | null>,
  referenceYear: number
): number[] => {
  const years = new Set(typologieYears);

  for (const structureId of structureIds) {
    const openingYear =
      getYearFromDate(openingDateByStructureId.get(structureId)) ??
      referenceYear;
    const closureYear =
      getYearFromDate(closureDateByStructureId.get(structureId) ?? null) ??
      referenceYear;
    const maxYear = Math.max(openingYear, closureYear, referenceYear);

    for (let year = Math.min(openingYear, closureYear); year <= maxYear; year += 1) {
      years.add(year);
    }
  }

  return [...years].sort((yearA, yearB) => yearA - yearB);
};

export const buildStatistiquesYearContext = (
  structureIds: number[],
  years: number[],
  openingDateByStructureId: Map<number, Date>,
  closureDateByStructureId: Map<number, Date | null>
): StatistiquesYearContext => {
  const yearContext: StatistiquesYearContext = {
    allStructureIds: structureIds,
    openingDateByStructureId,
    closureDateByStructureId,
    structuresActivesByYear: new Map(),
  };

  for (const year of years) {
    getActiveStructureIdsForYear(yearContext, year);
  }

  return yearContext;
};

export const getActiveStructureIdsForPeriod = (
  yearContext: StatistiquesYearContext,
  periodStart: Date,
  periodEnd: Date
): Set<number> => {
  const activeStructureIds = new Set<number>();

  for (const structureId of yearContext.allStructureIds) {
    if (
      isStructureActiveInPeriod(
        structureId,
        periodStart,
        periodEnd,
        yearContext
      )
    ) {
      activeStructureIds.add(structureId);
    }
  }

  return activeStructureIds;
};

export const getActiveStructureIdsForYear = (
  yearContext: StatistiquesYearContext,
  year: number
): Set<number> => {
  const cached = yearContext.structuresActivesByYear.get(year);
  if (cached) {
    return cached;
  }

  const { start, end } = getYearPeriodBounds(year);
  const activeStructureIds = getActiveStructureIdsForPeriod(
    yearContext,
    start,
    end
  );

  yearContext.structuresActivesByYear.set(year, activeStructureIds);
  return activeStructureIds;
};

export const filterStructuresForYear = (
  structures: StatistiqueDbStructure[],
  year: number,
  yearContext: StatistiquesYearContext
): StatistiqueDbStructure[] => {
  const activeStructureIds = getActiveStructureIdsForYear(yearContext, year);
  return structures.filter((structure) => activeStructureIds.has(structure.id));
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

// TODO: réemployer ces utils temporels pour les indicateurs RMU à implémenter.

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
