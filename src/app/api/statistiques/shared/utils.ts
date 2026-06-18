import { getYearFromDate } from "@/app/utils/date.util";
import { sumValues } from "@/app/utils/math.util";
import { StructureType } from "@/generated/prisma/client";
import {
  BatiStat,
  TypeStructureStat,
} from "@/schemas/api/statistique.schema";
import { REPARTITION_DISPLAY_ORDER } from "@/types/adresse.type";
import { STRUCTURE_TYPES_DISPLAY_ORDER } from "@/types/structure.type";

import type {
  StatistiqueDbCpomStructure,
  StatistiqueDbStructure,
  StatistiqueDbTypologie,
} from "./db.type";

/**
 * Shared stats helpers.
 *
 * TODO(structure-version): centraliser ici résolution `StructureVersion`
 * (dernière version avec effectiveDate <= dateRef) puis basculer les stats
 * vers champs portés par version. Garder API des helpers stable.
 */

// -------- Typologies (millésime) --------

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

export const getLatestTypologieYear = (
  typologies: StatistiqueDbTypologie[]
): number => {
  const years = getTypologieYears(typologies);
  return years.length > 0 ? years[years.length - 1] : new Date().getFullYear();
};

// -------- CPOM helpers --------

export const isCpomLinkActiveForYear = (
  link: StatistiqueDbCpomStructure,
  year: number
): boolean =>
  (!link.dateStart || getYearFromDate(link.dateStart) <= year) &&
  (!link.dateEnd || getYearFromDate(link.dateEnd) >= year);

export const countCpomsForYear = (
  cpomLinks: StatistiqueDbCpomStructure[],
  structureIds: Set<number>,
  year: number
): number => {
  const activeCpomIds = new Set<number>();
  for (const link of cpomLinks) {
    if (
      structureIds.has(link.structureId) &&
      isCpomLinkActiveForYear(link, year)
    ) {
      activeCpomIds.add(link.cpomId);
    }
  }
  return activeCpomIds.size;
};

export const countStructuresWithCpom = (
  cpomLinks: StatistiqueDbCpomStructure[],
  structureIds: number[],
  year: number
): number => {
  const idSet = new Set(structureIds);
  const structuresWithCpom = new Set<number>();
  for (const link of cpomLinks) {
    if (idSet.has(link.structureId) && isCpomLinkActiveForYear(link, year)) {
      structuresWithCpom.add(link.structureId);
    }
  }
  return structuresWithCpom.size;
};

// -------- Monthly helpers --------

export const getMonthKey = (date: Date): string => date.toISOString().slice(0, 7);

export const monthKeyToDate = (key: string): Date => new Date(`${key}-01`);

export const getMonthKeysFromDates = (dates: Date[]): string[] =>
  [...new Set(dates.map(getMonthKey))].sort();

// -------- Display fill helpers --------

export const fillStructureTypes = (stats: TypeStructureStat[]): TypeStructureStat[] => {
  const map = new Map(
    stats
      .filter((stat): stat is TypeStructureStat & { type: StructureType } =>
        stat.type !== null
      )
      .map((stat) => [stat.type, stat])
  );
  return STRUCTURE_TYPES_DISPLAY_ORDER.map((type) => ({
    type,
    structures: map.get(type)?.structures ?? 0,
    places: map.get(type)?.places ?? 0,
  }));
};

export const fillBatis = (stats: BatiStat[]): BatiStat[] => {
  const map = new Map(stats.map((stat) => [stat.bati, stat]));
  return REPARTITION_DISPLAY_ORDER.map((bati) => ({
    bati,
    structures: map.get(bati)?.structures ?? 0,
    places: map.get(bati)?.places ?? 0,
  }));
};

