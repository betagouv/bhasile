import {
  BatiStat,
  StructuresYearStat,
  TypeStructureStat,
} from "@/schemas/api/statistique.schema";
import { Repartition } from "@/types/adresse.type";
import { StructureType } from "@/types/structure.type";

import type {
  StatistiqueDbAdresse,
  StatistiqueDbCpomStructure,
  StatistiqueDbStructure,
  StatistiqueDbTypologie,
} from "../shared/db.type";
import {
  countCpoms,
  countStructuresWithCpom,
  fillBatis,
  fillStructureTypes,
  filterStructuresWithTypologie,
  getLastTypologiePerStructure,
  getTypologieMapForExactYear,
  getTypologieYears,
  type StatistiqueYearRef,
} from "../shared/utils";

const getRepartitionFromRepartitions = (
  repartitions: (Repartition | null | undefined)[]
): Repartition => {
  const valid = repartitions.filter(
    (repartition): repartition is Repartition => repartition != null
  );
  const hasDiffus = valid.includes(Repartition.DIFFUS);
  const hasCollectif = valid.includes(Repartition.COLLECTIF);
  if (hasDiffus && hasCollectif) {
    return Repartition.MIXTE;
  }
  if (hasDiffus) {
    return Repartition.DIFFUS;
  }
  return Repartition.COLLECTIF;
};

export const getBatiPerStructure = (
  adresses: StatistiqueDbAdresse[]
): Map<number, Repartition> => {
  const byStructure = new Map<number, Repartition[]>();
  for (const adresse of adresses) {
    if (adresse.structureId === null || adresse.repartition === null) {
      continue;
    }
    const list = byStructure.get(adresse.structureId) ?? [];
    list.push(adresse.repartition);
    byStructure.set(adresse.structureId, list);
  }
  const result = new Map<number, Repartition>();
  for (const [structureId, repartitions] of byStructure) {
    result.set(structureId, getRepartitionFromRepartitions(repartitions));
  }
  return result;
};

const aggregateStructuresByKey = <Key>(
  structures: StatistiqueDbStructure[],
  typologieMap: Map<number, StatistiqueDbTypologie>,
  getKey: (structure: StatistiqueDbStructure) => Key | null
): Map<Key, { structures: number; places: number }> => {
  const map = new Map<Key, { structures: number; places: number }>();
  for (const structure of structures) {
    const typologie = typologieMap.get(structure.id);
    if (!typologie) {
      continue;
    }
    const key = getKey(structure);
    if (key === null) {
      continue;
    }
    const current = map.get(key) ?? { structures: 0, places: 0 };
    map.set(key, {
      structures: current.structures + 1,
      places: current.places + (typologie.placesAutorisees ?? 0),
    });
  }
  return map;
};

export const computeTypeStats = (
  structures: StatistiqueDbStructure[],
  typologieMap: Map<number, StatistiqueDbTypologie>
): TypeStructureStat[] =>
  fillStructureTypes(
    Array.from(
      aggregateStructuresByKey(
        structures,
        typologieMap,
        (structure) => structure.type
      ).entries()
    )
      .filter(
        (entry): entry is [StructureType, { structures: number; places: number }] =>
          entry[0] !== null
      )
      .map(([type, stats]) => ({ type, ...stats }))
  );

export const computeBatiStats = (
  structures: StatistiqueDbStructure[],
  batiMap: Map<number, Repartition>,
  typologieMap: Map<number, StatistiqueDbTypologie>
): BatiStat[] =>
  fillBatis(
    Array.from(
      aggregateStructuresByKey(structures, typologieMap, (structure) =>
        batiMap.get(structure.id) ?? Repartition.COLLECTIF
      ).entries()
    ).map(([bati, stats]) => ({ bati, ...stats }))
  );

const computeStructuresSnapshot = (
  structures: StatistiqueDbStructure[],
  typologieMap: Map<number, StatistiqueDbTypologie>,
  batiMap: Map<number, Repartition>,
  cpomLinks: StatistiqueDbCpomStructure[],
  yearRef: StatistiqueYearRef
): Pick<
  StructuresYearStat,
  | "totalStructures"
  | "totalCpoms"
  | "structuresAvecCpom"
  | "structureTypes"
  | "structureBatis"
> => {
  const activeStructures = filterStructuresWithTypologie(structures, typologieMap);
  const activeIds = activeStructures.map((structure) => structure.id);

  return {
    totalStructures: activeStructures.length,
    totalCpoms: countCpoms(cpomLinks, new Set(activeIds), yearRef),
    structuresAvecCpom: countStructuresWithCpom(cpomLinks, activeIds, yearRef),
    structureTypes: computeTypeStats(activeStructures, typologieMap),
    structureBatis: computeBatiStats(activeStructures, batiMap, typologieMap),
  };
};

export const computeGlobalStructuresStats = (
  structures: StatistiqueDbStructure[],
  typologies: StatistiqueDbTypologie[],
  adresses: StatistiqueDbAdresse[],
  cpomLinks: StatistiqueDbCpomStructure[]
): Omit<StructuresYearStat, "year"> => {
  const typologieMap = getLastTypologiePerStructure(typologies);
  const structureYears = new Map(
    [...typologieMap.entries()].map(([structureId, typologie]) => [
      structureId,
      typologie.year,
    ])
  );

  return computeStructuresSnapshot(
    structures,
    typologieMap,
    getBatiPerStructure(adresses),
    cpomLinks,
    structureYears
  );
};

export const computeStructuresYearStats = (
  structures: StatistiqueDbStructure[],
  typologies: StatistiqueDbTypologie[],
  adresses: StatistiqueDbAdresse[],
  cpomLinks: StatistiqueDbCpomStructure[]
): StructuresYearStat[] => {
  const batiMap = getBatiPerStructure(adresses);

  return getTypologieYears(typologies).map((year) => ({
    year,
    ...computeStructuresSnapshot(
      structures,
      getTypologieMapForExactYear(typologies, year),
      batiMap,
      cpomLinks,
      year
    ),
  }));
};