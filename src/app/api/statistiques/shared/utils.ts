import { sumValues } from "@/app/utils/math.util";

import type {
  StatistiqueDbStructure,
  StatistiqueDbTypologie,
} from "./db.type";

/**
 * Shared stats helpers.
 *
 * TODO(structure-version): centraliser ici résolution `StructureVersion`
 * (dernière version avec effectiveDate <= now) puis basculer les stats
 * vers champs portés par version. Garder API des helpers stable.
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

// -------- Monthly --------

export const getMonthKey = (date: Date): string => date.toISOString().slice(0, 7);

export const monthKeyToDate = (key: string): Date => new Date(`${key}-01`);

export const getMonthKeysFromDates = (dates: Date[]): string[] =>
  [...new Set(dates.map(getMonthKey))].sort();
