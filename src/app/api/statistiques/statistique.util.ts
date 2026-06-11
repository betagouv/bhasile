import { Repartition, StructureType } from "@/generated/prisma/client";
import {
  StructureBatiStat,
  StructureStatByYear,
  StructureTypeStat,
  YearStat,
} from "@/schemas/api/statistique.schema";
import { RepartitionLabel } from "@/types/adresse.type";

import {
  AdresseRow,
  CpomStructureRow,
  StructureRow,
  TypologieRow,
} from "./statistique.db.type";

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

const getLastTypologiePerStructure = (
  typologies: TypologieRow[]
): Map<number, TypologieRow> => {
  const map = new Map<number, TypologieRow>();
  for (const typologie of typologies) {
    if (typologie.structureId !== null) {
      map.set(typologie.structureId, typologie);
    }
  }
  return map;
};

const getBatiPerStructure = (
  adresses: AdresseRow[]
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

const isCpomLinkActiveAtYearEnd = (
  dateStart: Date | null,
  dateEnd: Date | null,
  year: number
): boolean => {
  const yearEnd = new Date(year, 11, 31, 23, 59, 59, 999);
  const startOk = !dateStart || dateStart <= yearEnd;
  const endOk = !dateEnd || dateEnd >= yearEnd;
  return startOk && endOk;
};

export const countCpomsForStructureSet = (
  cpomLinks: CpomStructureRow[],
  structureIds: Set<number>,
  year: number
): number => {
  const activeCpomIds = new Set<number>();
  for (const link of cpomLinks) {
    if (!structureIds.has(link.structureId)) {
      continue;
    }
    if (!isCpomLinkActiveAtYearEnd(link.dateStart, link.dateEnd, year)) {
      continue;
    }
    activeCpomIds.add(link.cpomId);
  }
  return activeCpomIds.size;
};

const getStructureIdsByTypeAtYear = (
  year: number,
  structures: StructureRow[],
  typologies: TypologieRow[]
): Map<StructureType | null, Set<number>> => {
  const lastTypologieMap = getLastTypologiePerStructure(
    typologies.filter((typologie) => typologie.year <= year)
  );
  const map = new Map<StructureType | null, Set<number>>();
  for (const structure of structures) {
    if (!lastTypologieMap.has(structure.id)) {
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
  structures: StructureRow[],
  typologies: TypologieRow[],
  batiMap: Map<number, Repartition>
): Map<Repartition, Set<number>> => {
  const lastTypologieMap = getLastTypologiePerStructure(
    typologies.filter((typologie) => typologie.year <= year)
  );
  const map = new Map<Repartition, Set<number>>();
  for (const structure of structures) {
    if (!lastTypologieMap.has(structure.id)) {
      continue;
    }
    const bati = batiMap.get(structure.id) ?? Repartition.COLLECTIF;
    const ids = map.get(bati) ?? new Set<number>();
    ids.add(structure.id);
    map.set(bati, ids);
  }
  return map;
};

const sortTypes = (types: Iterable<StructureType | null>): StructureType[] => {
  const unique = [...new Set(types)].filter(
    (type): type is StructureType => type !== null
  );
  return unique.sort(
    (typeA, typeB) =>
      STRUCTURE_TYPE_ORDER.indexOf(typeA) - STRUCTURE_TYPE_ORDER.indexOf(typeB)
  );
};

const sortBatis = (batis: Iterable<Repartition>): Repartition[] => {
  const unique = [...new Set(batis)];
  return unique.sort(
    (batiA, batiB) => BATI_ORDER.indexOf(batiA) - BATI_ORDER.indexOf(batiB)
  );
};

const buildByYearEntries = (
  yearsDesc: YearStat[],
  getStructureIdsForYear: (yearStat: YearStat) => Set<number>,
  getStatsForYear: (
    yearStat: YearStat
  ) => Pick<StructureStatByYear, "structures" | "places">,
  cpomLinks: CpomStructureRow[]
): StructureStatByYear[] =>
  yearsDesc.map((yearStat) => {
    const structureIds = getStructureIdsForYear(yearStat);
    const stats = getStatsForYear(yearStat);
    return {
      year: yearStat.year,
      structures: stats.structures,
      places: stats.places,
      cpoms: countCpomsForStructureSet(
        cpomLinks,
        structureIds,
        yearStat.year
      ),
    };
  });

export const buildStructureTypesPivot = (
  byYear: YearStat[],
  structures: StructureRow[],
  typologies: TypologieRow[],
  cpomLinks: CpomStructureRow[]
): StructureTypeStat[] => {
  if (byYear.length === 0) {
    return [];
  }

  const types = sortTypes(
    byYear.flatMap((yearStat) => yearStat.byType.map((typeStat) => typeStat.type))
  );
  const yearsDesc = [...byYear].sort((yearA, yearB) => yearB.year - yearA.year);

  return types.map((type) => ({
    label: type,
    byYear: buildByYearEntries(
      yearsDesc,
      (yearStat) =>
        getStructureIdsByTypeAtYear(yearStat.year, structures, typologies).get(
          type
        ) ?? new Set<number>(),
      (yearStat) => {
        const typeStat = yearStat.byType.find(
          (entry) => entry.type === type
        );
        return {
          structures: typeStat?.structures ?? 0,
          places: typeStat?.places ?? 0,
        };
      },
      cpomLinks
    ),
  }));
};

export const buildStructureBatisPivot = (
  byYear: YearStat[],
  structures: StructureRow[],
  typologies: TypologieRow[],
  adresses: AdresseRow[],
  cpomLinks: CpomStructureRow[]
): StructureBatiStat[] => {
  if (byYear.length === 0) {
    return [];
  }

  const batiMap = getBatiPerStructure(adresses);
  const batis = sortBatis(
    byYear.flatMap((yearStat) => yearStat.byBati.map((batiStat) => batiStat.bati))
  );
  const yearsDesc = [...byYear].sort((yearA, yearB) => yearB.year - yearA.year);

  return batis.map((bati) => ({
    label: RepartitionLabel[bati as keyof typeof RepartitionLabel] ?? bati,
    byYear: buildByYearEntries(
      yearsDesc,
      (yearStat) =>
        getStructureIdsByBatiAtYear(
          yearStat.year,
          structures,
          typologies,
          batiMap
        ).get(bati) ?? new Set<number>(),
      (yearStat) => {
        const batiStat = yearStat.byBati.find((entry) => entry.bati === bati);
        return {
          structures: batiStat?.structures ?? 0,
          places: batiStat?.places ?? 0,
        };
      },
      cpomLinks
    ),
  }));
};
