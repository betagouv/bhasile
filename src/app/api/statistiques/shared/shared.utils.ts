import { NumericAggregation, sumValues } from "@/app/utils/math.util";

import type {
  StatistiqueDbDnaLink,
  StatistiqueDbStructure,
  StatistiqueDbTypologie,
} from "../statistiques.db.type";

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

  const typologieByStructureId = new Map<number, StatistiqueDbTypologie>();

  for (const [structureId, rows] of byStructure) {
    const resolved: StatistiqueDbTypologie = {
      structureId,
      year: rows[rows.length - 1].year,
      placesAutorisees: null,
      pmr: null,
      lgbt: null,
      fvvTeh: null,
    };

    for (let rowIndex = rows.length - 1; rowIndex >= 0; rowIndex -= 1) {
      const typologieRow = rows[rowIndex];
      for (const field of GLOBAL_TYPOLOGY_FIELDS) {
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

/** Typologies remontées pour un millésime donné uniquement. */
export const getTypologieMapForExactYear = (
  typologies: StatistiqueDbTypologie[],
  year: number
): Map<number, StatistiqueDbTypologie> => {
  const typologieByStructureId = new Map<number, StatistiqueDbTypologie>();
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
  const activeStructures = filterStructuresWithTypologie(
    structures,
    typologieMap
  );

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
  const dnaCodeToStructureIds = new Map<string, Set<number>>();

  for (const link of dnaLinks) {
    if (link.structureId === null) {
      continue;
    }
    const structureIds =
      dnaCodeToStructureIds.get(link.dna.code) ?? new Set<number>();
    structureIds.add(link.structureId);
    dnaCodeToStructureIds.set(link.dna.code, structureIds);
  }

  return dnaCodeToStructureIds;
};

// -------- Monthly --------

export const getMonthKey = (date: Date): string =>
  date.toISOString().slice(0, 7);

export const monthKeyToDate = (monthKey: string): Date =>
  new Date(`${monthKey}-01`);

export const getTwelveMonthCutoffKey = (): string => {
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
  return getMonthKey(twelveMonthsAgo);
};

export const groupByMonthKey = <Item>(
  items: Item[],
  getDate: (item: Item) => Date | null | undefined
): Map<string, Item[]> => {
  const byMonth = new Map<string, Item[]>();

  for (const item of items) {
    const date = getDate(item);
    if (!date) {
      continue;
    }
    const monthKey = getMonthKey(date);
    const itemsForMonth = byMonth.get(monthKey) ?? [];
    itemsForMonth.push(item);
    byMonth.set(monthKey, itemsForMonth);
  }

  return byMonth;
};

export const mergeSortedMonthKeys = (
  ...monthMaps: Array<Map<string, unknown>>
): string[] =>
  [...new Set(monthMaps.flatMap((monthMap) => [...monthMap.keys()]))].sort();

export const parseNumericAggregation = (
  aggregationParam: string | null
): NumericAggregation =>
  aggregationParam === "mediane" ? "mediane" : "moyenne";

export class StatistiquesPerimetreVideError extends Error {
  constructor() {
    super("Aucune structure ne correspond aux filtres sélectionnés.");
    this.name = "StatistiquesPerimetreVideError";
  }
}
