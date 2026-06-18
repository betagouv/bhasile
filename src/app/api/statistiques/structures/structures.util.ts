import { getYearFromDate } from "@/app/utils/date.util";
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
} from "../shared/db.type";
import {
  filterStructuresWithTypologie,
  getLastTypologiePerStructure,
  getTypologieMapForExactYear,
  getTypologieYears,
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

const getBatiPerStructure = (
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

const isCpomLinkActiveForYear = (
  link: StatistiqueDbCpomStructure,
  year: number
): boolean =>
  (!link.dateStart || getYearFromDate(link.dateStart) <= year) &&
  (!link.dateEnd || getYearFromDate(link.dateEnd) >= year);

const countActiveCpoms = (
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

const countStructuresWithActiveCpom = (
  cpomLinks: StatistiqueDbCpomStructure[],
  structureIds: number[],
  year: number
): number => {
  const idSet = new Set(structureIds);
  const structuresWithCpom = new Set<number>();

  for (const link of cpomLinks) {
    if (
      idSet.has(link.structureId) &&
      isCpomLinkActiveForYear(link, year)
    ) {
      structuresWithCpom.add(link.structureId);
    }
  }

  return structuresWithCpom.size;
};

const aggregateByKey = <Key>(
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

const fillStructureTypes = (stats: TypeStructureStat[]): TypeStructureStat[] => {
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

const fillBatis = (stats: BatiStat[]): BatiStat[] => {
  const map = new Map(stats.map((stat) => [stat.bati, stat]));
  return REPARTITION_DISPLAY_ORDER.map((bati) => ({
    bati,
    structures: map.get(bati)?.structures ?? 0,
    places: map.get(bati)?.places ?? 0,
  }));
};

const computeTypeStats = (
  structures: StatistiqueDbStructure[],
  typologieMap: Map<number, StatistiqueDbTypologie>
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
        (entry): entry is [StructureType, { structures: number; places: number }] =>
          entry[0] !== null
      )
      .map(([type, stats]) => ({ type, ...stats }))
  );

const computeBatiStats = (
  structures: StatistiqueDbStructure[],
  batiMap: Map<number, Repartition>,
  typologieMap: Map<number, StatistiqueDbTypologie>
): BatiStat[] =>
  fillBatis(
    Array.from(
      aggregateByKey(structures, typologieMap, (structure) =>
        batiMap.get(structure.id) ?? Repartition.COLLECTIF
      ).entries()
    ).map(([bati, stats]) => ({ bati, ...stats }))
  );

const countStructuresByType = (
  structures: StatistiqueDbStructure[],
  type: StructureType
): number =>
  structures.filter((structure) => structure.type === type).length;

const countStructuresByBati = (
  structures: StatistiqueDbStructure[],
  batiMap: Map<number, Repartition>,
  bati: Repartition
): number =>
  structures.filter(
    (structure) => (batiMap.get(structure.id) ?? Repartition.COLLECTIF) === bati
  ).length;

const computeByYearStats = (
  structures: StatistiqueDbStructure[],
  typologies: StatistiqueDbTypologie[],
  batiMap: Map<number, Repartition>,
  cpomLinks: StatistiqueDbCpomStructure[]
): StructuresByYearStat[] =>
  getTypologieYears(typologies).map((year) => {
    const activeStructures = filterStructuresWithTypologie(
      structures,
      getTypologieMapForExactYear(typologies, year)
    );
    const activeIds = activeStructures.map((structure) => structure.id);

    return {
      year,
      totalStructures: activeStructures.length,
      totalCpoms: countActiveCpoms(cpomLinks, new Set(activeIds), year),
      structuresCada: countStructuresByType(activeStructures, StructureType.CADA),
      structuresCph: countStructuresByType(activeStructures, StructureType.CPH),
      structuresHuda: countStructuresByType(activeStructures, StructureType.HUDA),
      structuresCaes: countStructuresByType(activeStructures, StructureType.CAES),
      structuresBatiCollectif: countStructuresByBati(
        activeStructures,
        batiMap,
        Repartition.COLLECTIF
      ),
      structuresBatiDiffus: countStructuresByBati(
        activeStructures,
        batiMap,
        Repartition.DIFFUS
      ),
      structuresBatiMixte: countStructuresByBati(
        activeStructures,
        batiMap,
        Repartition.MIXTE
      ),
    };
  });

export const computeStructuresStatistiques = (
  structures: StatistiqueDbStructure[],
  typologies: StatistiqueDbTypologie[],
  adresses: StatistiqueDbAdresse[],
  cpomLinks: StatistiqueDbCpomStructure[]
): StatistiqueApiRead["structures"] => {
  // TODO(fermeture): exclure les structures avec fermeture effective (filtre global périmètre)
  // TODO(actualisation): exposer updatedAt quand les formulaires d'actualisation seront disponibles

  const typologieMap = getLastTypologiePerStructure(typologies);
  const activeStructures = filterStructuresWithTypologie(structures, typologieMap);
  const batiMap = getBatiPerStructure(adresses);
  const structureIds = structures.map((structure) => structure.id);

  return {
    totalStructures: structures.length,
    totalCpoms: countActiveCpoms(cpomLinks, new Set(structureIds), CURRENT_YEAR),
    structuresAvecCpom: countStructuresWithActiveCpom(
      cpomLinks,
      structureIds,
      CURRENT_YEAR
    ),
    structureTypes: computeTypeStats(activeStructures, typologieMap),
    structureBatis: computeBatiStats(activeStructures, batiMap, typologieMap),
    byYear: computeByYearStats(structures, typologies, batiMap, cpomLinks),
  };
};
