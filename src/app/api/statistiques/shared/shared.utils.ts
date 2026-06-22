import { sumValues } from "@/app/utils/math.util";

import type {
  StatistiqueDbStructure,
  StatistiqueDbTypologie,
} from "../statistiques.db.type";

// TODO(post-transfo) : exclure les structures avec transfo FERMETURE effective.
export const filterStructuresActives = (
  structures: StatistiqueDbStructure[]
): StatistiqueDbStructure[] => structures;

const TYPOLOGIE_AGGREGATE_FIELDS = [
  "placesAutorisees",
  "pmr",
  "lgbt",
  "fvvTeh",
] as const satisfies readonly (keyof StatistiqueDbTypologie)[];

// Dernière valeur non nulle par champ et par structure (agrégat global).
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
