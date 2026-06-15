import type { StatistiqueDbTypologie } from "./db.type";

/** Dernier millésime disponible par structure (agrégat global). */
export const getLastTypologiePerStructure = (
  typologies: StatistiqueDbTypologie[]
): Map<number, StatistiqueDbTypologie> => {
  const map = new Map<number, StatistiqueDbTypologie>();
  for (const typologie of typologies) {
    if (typologie.structureId !== null) {
      map.set(typologie.structureId, typologie);
    }
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

export const getTypologieYears = (
  typologies: StatistiqueDbTypologie[]
): number[] =>
  [...new Set(typologies.map((typologie) => typologie.year))].sort(
    (yearA, yearB) => yearA - yearB
  );
