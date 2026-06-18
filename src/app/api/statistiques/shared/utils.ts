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
  StatistiqueDbAdresse,
  StatistiqueDbAdresseTypologie,
  StatistiqueDbCpomStructure,
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

/** Année unique (byYear) ou millésime propre à chaque structure (global). */
export type StatistiqueYearRef = number | Map<number, number>;

const getYearForStructure = (
  structureId: number,
  yearRef: StatistiqueYearRef
): number | undefined =>
  typeof yearRef === "number" ? yearRef : yearRef.get(structureId);

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

export const sumGlobalAdressePlacesSpeciales = (
  adresses: StatistiqueDbAdresse[],
  adresseTypologies: StatistiqueDbAdresseTypologie[],
  structureIds: Set<number>
): { qpv: number; logementsSociaux: number } => {
  const lastTypologieByAdresse = new Map<number, StatistiqueDbAdresseTypologie>();

  for (const typologie of adresseTypologies) {
    const structureId = typologie.adresse.structureId;
    if (structureId === null || !structureIds.has(structureId)) {
      continue;
    }
    lastTypologieByAdresse.set(typologie.adresseId, typologie);
  }

  let qpv = 0;
  let logementsSociaux = 0;

  for (const adresse of adresses) {
    if (adresse.structureId === null || !structureIds.has(adresse.structureId)) {
      continue;
    }

    const lastTypologie = lastTypologieByAdresse.get(adresse.id);
    if (lastTypologie) {
      qpv += lastTypologie.qpv;
      logementsSociaux += lastTypologie.logementSocial;
      continue;
    }

    qpv += adresse.qpv ?? 0;
    logementsSociaux += adresse.logementSocial ?? 0;
  }

  return { qpv, logementsSociaux };
};

// -------- CPOM --------

const isCpomLinkActiveForYear = (
  link: StatistiqueDbCpomStructure,
  year: number
): boolean =>
  (!link.dateStart || getYearFromDate(link.dateStart) <= year) &&
  (!link.dateEnd || getYearFromDate(link.dateEnd) >= year);

export const countCpoms = (
  cpomLinks: StatistiqueDbCpomStructure[],
  structureIds: Set<number>,
  yearRef: StatistiqueYearRef
): number => {
  const activeCpomIds = new Set<number>();

  for (const link of cpomLinks) {
    if (!structureIds.has(link.structureId)) {
      continue;
    }
    const year = getYearForStructure(link.structureId, yearRef);
    if (year !== undefined && isCpomLinkActiveForYear(link, year)) {
      activeCpomIds.add(link.cpomId);
    }
  }

  return activeCpomIds.size;
};

export const countStructuresWithCpom = (
  cpomLinks: StatistiqueDbCpomStructure[],
  structureIds: number[],
  yearRef: StatistiqueYearRef
): number => {
  const idSet = new Set(structureIds);
  const structuresWithCpom = new Set<number>();

  for (const link of cpomLinks) {
    const year = getYearForStructure(link.structureId, yearRef);
    if (
      idSet.has(link.structureId) &&
      year !== undefined &&
      isCpomLinkActiveForYear(link, year)
    ) {
      structuresWithCpom.add(link.structureId);
    }
  }

  return structuresWithCpom.size;
};

// -------- Monthly --------

export const getMonthKey = (date: Date): string => date.toISOString().slice(0, 7);

export const monthKeyToDate = (key: string): Date => new Date(`${key}-01`);

export const getMonthKeysFromDates = (dates: Date[]): string[] =>
  [...new Set(dates.map(getMonthKey))].sort();

// -------- Display fill --------

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
