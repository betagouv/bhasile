import type { StructureDbList } from "@/app/api/structures/structure.db.type";
import { isStructureInCpom } from "@/app/api/structures/structure.util";
import { CURRENT_YEAR } from "@/constants";
import {
  BatiStat,
  StatistiqueApiRead,
  StructuresByYearStat,
  TypeStructureStat,
} from "@/schemas/api/statistique.schema";
import { Repartition, REPARTITION_DISPLAY_ORDER } from "@/types/adresse.type";
import {
  STRUCTURE_TYPES_DISPLAY_ORDER,
  StructureType,
} from "@/types/structure.type";

import type {
  StatistiqueDbAdresse,
  StatistiqueDbCpomStructure,
  StatistiqueDbStructure,
  StatistiqueDbTypologie,
  StatistiqueDbTypologieValues,
  StatistiquesContext,
  StatistiquesActivityContext,
} from "../statistiques.db.type";
import {
  filterStructuresForPeriod,
  filterStructuresWithTypologie,
  getLastTypologiePerStructure,
  getTypologieMapForExactYear,
  getTypologieYears,
} from "../statistiques.utils";

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

const countStructuresPerBati = (
  structures: StatistiqueDbStructure[],
  batiMap: Map<number, Repartition>
): Map<Repartition, number> => {
  const countsByBati = new Map<Repartition, number>();

  for (const structure of structures) {
    const bati = batiMap.get(structure.id) ?? Repartition.COLLECTIF;
    countsByBati.set(bati, (countsByBati.get(bati) ?? 0) + 1);
  }

  return countsByBati;
};

const sumPlacesPerBati = (
  adresses: StatistiqueDbAdresse[],
  activeStructureIds: Set<number>
): Map<Repartition, number> => {
  const placesByBati = new Map<Repartition, number>();

  for (const adresse of adresses) {
    if (
      adresse.structureId === null ||
      !activeStructureIds.has(adresse.structureId)
    ) {
      continue;
    }

    const bati = (adresse.repartition ?? Repartition.COLLECTIF) as Repartition;
    const places = adresse.placesAutorisees ?? 0;

    placesByBati.set(bati, (placesByBati.get(bati) ?? 0) + places);
  }

  return placesByBati;
};

const getBatiPerStructure = (
  adresses: StatistiqueDbAdresse[]
): Map<number, Repartition> => {
  const byStructure = new Map<number, Repartition[]>();

  for (const adresse of adresses) {
    if (adresse.structureId === null || adresse.repartition === null) {
      continue;
    }
    const repartitionsForStructure = byStructure.get(adresse.structureId) ?? [];
    repartitionsForStructure.push(adresse.repartition);
    byStructure.set(adresse.structureId, repartitionsForStructure);
  }

  const result = new Map<number, Repartition>();
  for (const [structureId, repartitions] of byStructure) {
    result.set(
      structureId,
      getRepartitionFromRepartitions(repartitions) as Repartition
    );
  }
  return result;
};

const countActiveCpoms = (
  cpomLinks: StatistiqueDbCpomStructure[],
  structureIds: Set<number>,
  year: number
): number => {
  const activeCpomIds = new Set<number>();

  for (const link of cpomLinks) {
    if (
      structureIds.has(link.structureId) &&
      isStructureInCpom({ cpomStructures: [link] } as StructureDbList, year)
    ) {
      activeCpomIds.add(link.cpomId);
    }
  }

  return activeCpomIds.size;
};

const countStructuresWithActiveCpom = (
  cpomLinks: StatistiqueDbCpomStructure[],
  structureIds: number[],
  year: number
): number => {
  const structureIdSet = new Set(structureIds);
  const linksByStructure = new Map<number, StatistiqueDbCpomStructure[]>();

  for (const link of cpomLinks) {
    if (!structureIdSet.has(link.structureId)) {
      continue;
    }
    const structureLinks = linksByStructure.get(link.structureId) ?? [];
    structureLinks.push(link);
    linksByStructure.set(link.structureId, structureLinks);
  }

  let count = 0;
  for (const structureLinks of linksByStructure.values()) {
    if (
      isStructureInCpom(
        { cpomStructures: structureLinks } as StructureDbList,
        year
      )
    ) {
      count += 1;
    }
  }

  return count;
};

const aggregateByKey = <GroupKey>(
  structures: StatistiqueDbStructure[],
  typologieMap: Map<number, StatistiqueDbTypologieValues>,
  getGroupKey: (structure: StatistiqueDbStructure) => GroupKey | null
): Map<GroupKey, { structures: number; places: number }> => {
  const statsByGroupKey = new Map<
    GroupKey,
    { structures: number; places: number }
  >();

  for (const structure of structures) {
    const typologie = typologieMap.get(structure.id);
    if (!typologie) {
      continue;
    }
    const groupKey = getGroupKey(structure);
    if (groupKey === null) {
      continue;
    }
    const current = statsByGroupKey.get(groupKey) ?? {
      structures: 0,
      places: 0,
    };
    statsByGroupKey.set(groupKey, {
      structures: current.structures + 1,
      places: current.places + (typologie.placesAutorisees ?? 0),
    });
  }

  return statsByGroupKey;
};

const fillStructureTypes = (
  stats: TypeStructureStat[]
): TypeStructureStat[] => {
  const statsByType = new Map(
    stats
      .filter(
        (stat): stat is TypeStructureStat & { type: StructureType } =>
          stat.type !== null
      )
      .map((stat) => [stat.type, stat])
  );
  return STRUCTURE_TYPES_DISPLAY_ORDER.map((structureType) => ({
    type: structureType,
    structures: statsByType.get(structureType)?.structures ?? 0,
    places: statsByType.get(structureType)?.places ?? 0,
  }));
};

const fillBatis = (stats: BatiStat[]): BatiStat[] => {
  const statsByBati = new Map(stats.map((stat) => [stat.bati, stat]));
  return REPARTITION_DISPLAY_ORDER.map((bati) => ({
    bati,
    structures: statsByBati.get(bati)?.structures ?? 0,
    places: statsByBati.get(bati)?.places ?? 0,
  }));
};

const computeTypeStats = (
  structures: StatistiqueDbStructure[],
  typologieMap: Map<number, StatistiqueDbTypologieValues>
): TypeStructureStat[] =>
  fillStructureTypes(
    Array.from(
      aggregateByKey(
        structures,
        typologieMap,
        (structure) => structure.type as StructureType
      ).entries()
    )
      .filter(
        (
          groupEntry
        ): groupEntry is [
          StructureType,
          { structures: number; places: number },
        ] => groupEntry[0] !== null
      )
      .map(([structureType, typeStats]) => ({
        type: structureType,
        ...typeStats,
      }))
  );

const computeBatiStats = (
  structures: StatistiqueDbStructure[],
  batiMap: Map<number, Repartition>,
  adresses: StatistiqueDbAdresse[]
): BatiStat[] => {
  const activeStructureIds = new Set(
    structures.map((structure) => structure.id)
  );
  const structuresByBati = countStructuresPerBati(structures, batiMap);
  const placesByBati = sumPlacesPerBati(adresses, activeStructureIds);

  return fillBatis(
    REPARTITION_DISPLAY_ORDER.map((bati) => ({
      bati,
      structures: structuresByBati.get(bati) ?? 0,
      places: placesByBati.get(bati) ?? 0,
    }))
  );
};

const countStructuresByType = (
  structures: StatistiqueDbStructure[],
  type: StructureType
): number => structures.filter((structure) => structure.type === type).length;

const countStructuresByBati = (
  structures: StatistiqueDbStructure[],
  batiMap: Map<number, Repartition>,
  bati: Repartition
): number =>
  structures.filter(
    (structure) => (batiMap.get(structure.id) ?? Repartition.COLLECTIF) === bati
  ).length;

const computeByYearStats = (
  allStructures: StatistiqueDbStructure[],
  activityContext: StatistiquesActivityContext,
  typologies: StatistiqueDbTypologie[],
  batiMap: Map<number, Repartition>,
  cpomLinks: StatistiqueDbCpomStructure[]
): StructuresByYearStat[] =>
  getTypologieYears(typologies).map((year) => {
    const structuresActives = filterStructuresForPeriod(
      allStructures,
      "year",
      String(year),
      activityContext
    );
    const structuresWithTypologie = filterStructuresWithTypologie(
      structuresActives,
      getTypologieMapForExactYear(typologies, year)
    );
    const structureIdsWithTypologie = structuresWithTypologie.map(
      (structure) => structure.id
    );

    return {
      year,
      totalStructures: structuresWithTypologie.length,
      totalCpoms: countActiveCpoms(
        cpomLinks,
        new Set(structureIdsWithTypologie),
        year
      ),
      structuresCada: countStructuresByType(
        structuresWithTypologie,
        StructureType.CADA
      ),
      structuresCph: countStructuresByType(
        structuresWithTypologie,
        StructureType.CPH
      ),
      structuresHuda: countStructuresByType(
        structuresWithTypologie,
        StructureType.HUDA
      ),
      structuresCaes: countStructuresByType(
        structuresWithTypologie,
        StructureType.CAES
      ),
      structuresBatiCollectif: countStructuresByBati(
        structuresWithTypologie,
        batiMap,
        Repartition.COLLECTIF
      ),
      structuresBatiDiffus: countStructuresByBati(
        structuresWithTypologie,
        batiMap,
        Repartition.DIFFUS
      ),
      structuresBatiMixte: countStructuresByBati(
        structuresWithTypologie,
        batiMap,
        Repartition.MIXTE
      ),
    };
  });

export const computeStructuresStatistiques = (
  context: StatistiquesContext
): StatistiqueApiRead["structures"] => {
  const { structures, allStructures, activityContext, typologies, adresses, cpomLinks } =
    context;
  const typologieMap = getLastTypologiePerStructure(typologies);
  const structuresWithTypologie = filterStructuresWithTypologie(
    structures,
    typologieMap
  );
  const batiMap = getBatiPerStructure(adresses);
  const activeStructureIds = structures.map((structure) => structure.id);

  return {
    totalStructures: structures.length,
    totalCpoms: countActiveCpoms(
      cpomLinks,
      new Set(activeStructureIds),
      CURRENT_YEAR
    ),
    structuresAvecCpom: countStructuresWithActiveCpom(
      cpomLinks,
      activeStructureIds,
      CURRENT_YEAR
    ),
    structureTypes: computeTypeStats(structuresWithTypologie, typologieMap),
    structureBatis: computeBatiStats(
      structuresWithTypologie,
      batiMap,
      adresses
    ),
    byYear: computeByYearStats(
      allStructures,
      activityContext,
      typologies,
      batiMap,
      cpomLinks
    ),
  };
};
