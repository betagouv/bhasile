import { Repartition, StructureType } from "@/generated/prisma/client";
import { getYearFromDate } from "@/app/utils/date.util";
import {
  StructureBatiStat,
  StructureStatByYear,
  StructureTypeStat,
  YearStat,
} from "@/schemas/api/statistique.schema";
import { RepartitionLabel } from "@/types/adresse.type";

import {
  StatistiqueDbAdresse,
  StatistiqueDbCpomStructure,
  StatistiqueDbStructure,
  StatistiqueDbTypologie,
} from "./statistique.db.type";

// Tri pour affichage simplifié ensuite côté front
const STRUCTURE_TYPE_ORDER: StructureType[] = [
  StructureType.CADA,
  StructureType.CAES,
  StructureType.CPH,
  StructureType.HUDA,
  StructureType.PRAHDA,
];

const BATI_ORDER: Repartition[] = [
  Repartition.DIFFUS,
  Repartition.COLLECTIF,
  Repartition.MIXTE,
];

const sortTypes = (types: Iterable<StructureType | null>): StructureType[] =>
  [...new Set(types)]
    .filter((type): type is StructureType => type !== null)
    .sort(
      (typeA, typeB) =>
        STRUCTURE_TYPE_ORDER.indexOf(typeA) -
        STRUCTURE_TYPE_ORDER.indexOf(typeB)
    );

const sortBatis = (batis: Iterable<Repartition>): Repartition[] =>
  [...new Set(batis)].sort(
    (batiA, batiB) => BATI_ORDER.indexOf(batiA) - BATI_ORDER.indexOf(batiB)
  );

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
    const hasDiffus = repartitions.includes(Repartition.DIFFUS);
    const hasCollectif = repartitions.includes(Repartition.COLLECTIF);
    if (hasDiffus && hasCollectif) {
      result.set(structureId, Repartition.MIXTE);
    } else if (hasDiffus) {
      result.set(structureId, Repartition.DIFFUS);
    } else {
      result.set(structureId, Repartition.COLLECTIF);
    }
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

// Retourne les structures pour une année donnée

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

// Regroupe les stats annuelles par catégorie (type, bâti, ...) pour le format API front

const buildGroupedStatsByYear = <FieldToGroupBy>(
  byYear: YearStat[],
  cpomLinks: StatistiqueDbCpomStructure[],
  fieldsToGroupBy: FieldToGroupBy[],
  options: {
    getLabel: (fieldToGroupBy: FieldToGroupBy) => string;
    getStructureIds: (
      year: number,
      fieldToGroupBy: FieldToGroupBy
    ) => Set<number>;
    getStats: (
      yearStat: YearStat,
      fieldToGroupBy: FieldToGroupBy
    ) => Pick<StructureStatByYear, "structures" | "places">;
  }
): StructureTypeStat[] => {
  const yearsDesc = [...byYear].sort((yearA, yearB) => yearB.year - yearA.year);

  return fieldsToGroupBy.map((fieldToGroupBy) => ({
    label: options.getLabel(fieldToGroupBy),
    byYear: yearsDesc.map((yearStat) => {
      const stats = options.getStats(yearStat, fieldToGroupBy);
      return {
        year: yearStat.year,
        structures: stats.structures,
        places: stats.places,
        cpoms: countCpomsForStructureSet(
          cpomLinks,
          options.getStructureIds(yearStat.year, fieldToGroupBy),
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

  const types = sortTypes(
    byYear.flatMap((yearStat) =>
      yearStat.byType.map((typeStat) => typeStat.type)
    )
  );

  return buildGroupedStatsByYear(byYear, cpomLinks, types, {
    getLabel: (structureType) => structureType,
    getStructureIds: (year, structureType) =>
      getStructureIdsByTypeAtYear(year, structures, typologies).get(
        structureType
      ) ?? new Set<number>(),
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
  const batis = sortBatis(
    byYear.flatMap((yearStat) =>
      yearStat.byBati.map((batiStat) => batiStat.bati)
    )
  );

  return buildGroupedStatsByYear(byYear, cpomLinks, batis, {
    getLabel: (repartition) =>
      RepartitionLabel[repartition as keyof typeof RepartitionLabel] ??
      repartition,
    getStructureIds: (year, repartition) =>
      getStructureIdsByBatiAtYear(year, structures, typologies, batiMap).get(
        repartition
      ) ?? new Set<number>(),
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
