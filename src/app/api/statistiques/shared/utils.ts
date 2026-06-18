import { sumValues } from "@/app/utils/math.util";

import type {
  StatistiqueDbDnaLink,
  StatistiqueDbStructure,
  StatistiqueDbTypologie,
} from "./db.type";

/**
 * Shared stats helpers.
 *
 * TODO(fermeture): exclure les structures fermées du périmètre.
 * TODO(actualisation): exposer updatedAt par bloc quand disponible.
 * TODO(structure-version): résolution `StructureVersion` (effectiveDate <= now).
 */

const GLOBAL_TYPOLOGY_FIELDS = [
  "placesAutorisees",
  "pmr",
  "lgbt",
  "fvvTeh",
] as const satisfies readonly (keyof Pick<
  StatistiqueDbTypologie,
  "placesAutorisees" | "pmr" | "lgbt" | "fvvTeh"
>)[];

// -------- Typologies (millésime) --------

/** Dernière valeur non nulle par champ et par structure (agrégat global). */
export const getLastTypologiePerStructure = (
  typologies: StatistiqueDbTypologie[]
): Map<number, StatistiqueDbTypologie> => {
  const byStructure = new Map<number, StatistiqueDbTypologie[]>();

  for (const typologie of typologies) {
    if (typologie.structureId === null) {
      continue;
    }
    const rows = byStructure.get(typologie.structureId) ?? [];
    rows.push(typologie);
    byStructure.set(typologie.structureId, rows);
  }

  const map = new Map<number, StatistiqueDbTypologie>();

  for (const [structureId, rows] of byStructure) {
    const resolved: StatistiqueDbTypologie = {
      structureId,
      year: rows[rows.length - 1].year,
      placesAutorisees: null,
      pmr: null,
      lgbt: null,
      fvvTeh: null,
    };

    for (let index = rows.length - 1; index >= 0; index -= 1) {
      const row = rows[index];
      for (const field of GLOBAL_TYPOLOGY_FIELDS) {
        if (resolved[field] == null && row[field] != null) {
          resolved[field] = row[field];
          if (field === "placesAutorisees") {
            resolved.year = row.year;
          }
        }
      }
    }

    map.set(structureId, resolved);
  }

  return map;
};

/** Typologies remontées pour un millésime donné uniquement. */
export const getTypologieMapForExactYear = (
  typologies: StatistiqueDbTypologie[],
  year: number
): Map<number, StatistiqueDbTypologie> => {
  const map = new Map<number, StatistiqueDbTypologie>();
  for (const typologie of typologies) {
    if (typologie.year === year && typologie.structureId !== null) {
      map.set(typologie.structureId, typologie);
    }
  }
  return map;
};

export const getTypologieYears = (typologies: StatistiqueDbTypologie[]): number[] =>
  [...new Set(typologies.map((typologie) => typologie.year))].sort(
    (yearA, yearB) => yearA - yearB
  );

export const filterStructuresWithTypologie = (
  structures: StatistiqueDbStructure[],
  typologieMap: Map<number, StatistiqueDbTypologie>
): StatistiqueDbStructure[] =>
  structures.filter((structure) => typologieMap.has(structure.id));

export const computeTotalPlaces = (
  structures: StatistiqueDbStructure[],
  typologieMap: Map<number, StatistiqueDbTypologie>
): number =>
  sumValues(
    structures.map(
      (structure) => typologieMap.get(structure.id)?.placesAutorisees
    )
  ) ?? 0;

export type ActiveStructuresScope = {
  activeStructures: StatistiqueDbStructure[];
  activeStructureIds: number[];
  totalPlacesAutorisees: number;
};

export const getActiveStructuresScope = (
  structures: StatistiqueDbStructure[],
  typologies: StatistiqueDbTypologie[]
): ActiveStructuresScope => {
  const typologieMap = getLastTypologiePerStructure(typologies);
  const activeStructures = filterStructuresWithTypologie(structures, typologieMap);

  return {
    activeStructures,
    activeStructureIds: activeStructures.map((structure) => structure.id),
    totalPlacesAutorisees: computeTotalPlaces(activeStructures, typologieMap),
  };
};

// -------- DNA --------

export const buildDnaCodeToStructureIds = (
  dnaLinks: StatistiqueDbDnaLink[]
): Map<string, Set<number>> => {
  const map = new Map<string, Set<number>>();

  for (const link of dnaLinks) {
    if (link.structureId === null) {
      continue;
    }
    const structureIds = map.get(link.dna.code) ?? new Set<number>();
    structureIds.add(link.structureId);
    map.set(link.dna.code, structureIds);
  }

  return map;
};

// -------- Monthly --------

export const getMonthKey = (date: Date): string => date.toISOString().slice(0, 7);

export const monthKeyToDate = (key: string): Date => new Date(`${key}-01`);

export const getTwelveMonthCutoffKey = (): string => {
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
  return getMonthKey(twelveMonthsAgo);
};

export const groupByMonthKey = <T>(
  items: T[],
  getDate: (item: T) => Date | null | undefined
): Map<string, T[]> => {
  const byMonth = new Map<string, T[]>();

  for (const item of items) {
    const date = getDate(item);
    if (!date) {
      continue;
    }
    const key = getMonthKey(date);
    const list = byMonth.get(key) ?? [];
    list.push(item);
    byMonth.set(key, list);
  }

  return byMonth;
};

export const mergeSortedMonthKeys = (
  ...monthMaps: Array<Map<string, unknown>>
): string[] =>
  [...new Set(monthMaps.flatMap((monthMap) => [...monthMap.keys()]))].sort();
