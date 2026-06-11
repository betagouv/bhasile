import { getYearFromDate } from "@/app/utils/date.util";
import {
  StructureBatiStat,
  StructureStatByYear,
  StructureTypeStat,
  YearStat,
} from "@/schemas/api/statistique.schema";
import {
  REPARTITION_DISPLAY_ORDER,
  Repartition,
  RepartitionLabel,
} from "@/types/adresse.type";
import { STRUCTURE_TYPES_DISPLAY_ORDER, StructureType } from "@/types/structure.type";

import {
  StatistiqueDbAdresse,
  StatistiqueDbCpomStructure,
  StatistiqueDbStructure,
  StatistiqueDbTypologie,
} from "./statistique.db.type";

const sortByDefinedOrder = <T>(items: Iterable<T>, order: T[]): T[] =>
  [...new Set(items)].sort(
    (itemA, itemB) => order.indexOf(itemA) - order.indexOf(itemB)
  );

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

const countCpomsForStructureSet = (
  cpomLinks: StatistiqueDbCpomStructure[],
  structureIds: Set<number>,
  year: number
): number => {
  const activeCpomIds = new Set<number>();
  for (const link of cpomLinks) {
    if (
      structureIds.has(link.structureId) &&
      (!link.dateStart || getYearFromDate(link.dateStart) <= year) &&
      (!link.dateEnd || getYearFromDate(link.dateEnd) >= year)
    ) {
      activeCpomIds.add(link.cpomId);
    }
  }
  return activeCpomIds.size;
};

const getActiveStructuresAtYear = (
  year: number,
  structures: StatistiqueDbStructure[],
  typologies: StatistiqueDbTypologie[]
): StatistiqueDbStructure[] => {
  const lastTypologieMap = getLastTypologiePerStructure(
    typologies.filter((typologie) => typologie.year <= year)
  );
  return structures.filter((structure) => lastTypologieMap.has(structure.id));
};

const getStructureIdsByTypeAtYear = (
  year: number,
  structures: StatistiqueDbStructure[],
  typologies: StatistiqueDbTypologie[]
): Map<StructureType, Set<number>> => {
  const map = new Map<StructureType, Set<number>>();
  for (const structure of getActiveStructuresAtYear(
    year,
    structures,
    typologies
  )) {
    if (structure.type === null) {
      continue;
    }
    const ids = map.get(structure.type) ?? new Set<number>();
    ids.add(structure.id);
    map.set(structure.type, ids);
  }
  return map;
};

const getStructureIdsByBatiAtYear = (
  year: number,
  structures: StatistiqueDbStructure[],
  typologies: StatistiqueDbTypologie[],
  batiMap: Map<number, Repartition>
): Map<Repartition, Set<number>> => {
  const map = new Map<Repartition, Set<number>>();
  for (const structure of getActiveStructuresAtYear(
    year,
    structures,
    typologies
  )) {
    const bati = batiMap.get(structure.id) ?? Repartition.COLLECTIF;
    const ids = map.get(bati) ?? new Set<number>();
    ids.add(structure.id);
    map.set(bati, ids);
  }
  return map;
};

const buildGroupedStatsByYear = <Key>(
  byYear: YearStat[],
  cpomLinks: StatistiqueDbCpomStructure[],
  keys: Key[],
  options: {
    getLabel: (key: Key) => string;
    getStructureIds: (year: number, key: Key) => Set<number>;
    getStats: (
      yearStat: YearStat,
      key: Key
    ) => Pick<StructureStatByYear, "structures" | "places">;
  }
): StructureTypeStat[] => {
  const yearsDesc = [...byYear].sort((yearA, yearB) => yearB.year - yearA.year);

  return keys.map((key) => ({
    label: options.getLabel(key),
    byYear: yearsDesc.map((yearStat) => {
      const stats = options.getStats(yearStat, key);
      return {
        year: yearStat.year,
        structures: stats.structures,
        places: stats.places,
        cpoms: countCpomsForStructureSet(
          cpomLinks,
          options.getStructureIds(yearStat.year, key),
          yearStat.year
        ),
      };
    }),
  }));
};

export const buildStructureTypesStats = (
  byYear: YearStat[],
  structures: StatistiqueDbStructure[],
  typologies: StatistiqueDbTypologie[],
  cpomLinks: StatistiqueDbCpomStructure[]
): StructureTypeStat[] => {
  if (byYear.length === 0) {
    return [];
  }

  const structureIdsByYear = new Map(
    byYear.map((yearStat) => [
      yearStat.year,
      getStructureIdsByTypeAtYear(yearStat.year, structures, typologies),
    ])
  );

  const types = sortByDefinedOrder(
    byYear.flatMap((yearStat) =>
      yearStat.byType.map((typeStat) => typeStat.type)
    ),
    STRUCTURE_TYPES_DISPLAY_ORDER as StructureType[]
  ).filter((type): type is StructureType => type !== null);

  return buildGroupedStatsByYear(byYear, cpomLinks, types, {
    getLabel: (structureType) => structureType,
    getStructureIds: (year, structureType) =>
      structureIdsByYear.get(year)?.get(structureType) ?? new Set<number>(),
    getStats: (yearStat, structureType) => {
      const typeStat = yearStat.byType.find(
        (entry) => entry.type === structureType
      );
      return {
        structures: typeStat?.structures ?? 0,
        places: typeStat?.places ?? 0,
      };
    },
  });
};

export const buildStructureBatisStats = (
  byYear: YearStat[],
  structures: StatistiqueDbStructure[],
  typologies: StatistiqueDbTypologie[],
  adresses: StatistiqueDbAdresse[],
  cpomLinks: StatistiqueDbCpomStructure[]
): StructureBatiStat[] => {
  if (byYear.length === 0) {
    return [];
  }

  const batiMap = getBatiPerStructure(adresses);
  const structureIdsByYear = new Map(
    byYear.map((yearStat) => [
      yearStat.year,
      getStructureIdsByBatiAtYear(
        yearStat.year,
        structures,
        typologies,
        batiMap
      ),
    ])
  );

  const batis = sortByDefinedOrder(
    byYear.flatMap((yearStat) =>
      yearStat.byBati.map((batiStat) => batiStat.bati)
    ),
    REPARTITION_DISPLAY_ORDER as Repartition[]
  );

  return buildGroupedStatsByYear(byYear, cpomLinks, batis, {
    getLabel: (repartition) =>
      RepartitionLabel[repartition as keyof typeof RepartitionLabel] ??
      repartition,
    getStructureIds: (year, repartition) =>
      structureIdsByYear.get(year)?.get(repartition) ?? new Set<number>(),
    getStats: (yearStat, repartition) => {
      const batiStat = yearStat.byBati.find(
        (entry) => entry.bati === repartition
      );
      return {
        structures: batiStat?.structures ?? 0,
        places: batiStat?.places ?? 0,
      };
    },
  });
};
