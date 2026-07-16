import { getDatesOfCurrentActeAdministratif } from "@/app/api/actes-administratifs/acte-administratif.util";
import type { StructureDbList } from "@/app/api/structures/structure.db.type";
import { isStructureInCpom } from "@/app/api/structures/structure.util";
import { startOfUtcDay } from "@/app/utils/date.util";
import { EXCLUDED_STRUCTURE_TYPES } from "@/constants";
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
  StatistiqueDbTypologieValues,
  StatistiquesContext,
  StatistiquesCpomYearContext,
} from "../statistiques.db.type";
import {
  computeTotalPlaces,
  filterByActiveStructureId,
  filterByEffectiveVersionAtDate,
  filterStructuresWithTypologie,
  getLastTypologiePerStructure,
  getTypologieMapForExactYear,
  mapTypologieYears,
  resolveStructuresWithTypologieForYear,
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
    // Bâti = répartition des adresses de la dernière version
    const bati = batiMap.get(structure.id);
    if (bati == null) {
      continue;
    }
    countsByBati.set(bati, (countsByBati.get(bati) ?? 0) + 1);
  }

  return countsByBati;
};

const sumPlacesPerBati = (
  adresses: StatistiqueDbAdresse[],
  activeStructureIds: Set<number>
): Map<Repartition, number> => {
  const placesByBati = new Map<Repartition, number>();

  for (const adresse of filterByActiveStructureId(
    adresses,
    activeStructureIds
  )) {
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

/** Counts structures covered by an active CPOM for the year. */
export const countStructuresAvecCpomForYear = (
  cpomLinks: StatistiqueDbCpomStructure[],
  structureIds: Set<number>,
  year: number
): number => {
  const structuresWithActiveCpom = new Set<number>();

  for (const link of cpomLinks) {
    if (
      structureIds.has(link.structureId) &&
      isStructureInCpom({ cpomStructures: [link] } as StructureDbList, year)
    ) {
      structuresWithActiveCpom.add(link.structureId);
    }
  }

  return structuresWithActiveCpom.size;
};

const isCpomLinkActiveNow = (
  link: StatistiqueDbCpomStructure,
  now: Date
): boolean => {
  const [cpomDateStart, cpomDateEnd] = getDatesOfCurrentActeAdministratif(
    link.cpom?.actesAdministratifs ?? [],
    "CONVENTION_CPOM",
    false
  );
  const dateStart = link.dateStart ?? cpomDateStart;
  const dateEnd = link.dateEnd ?? cpomDateEnd;

  if (!dateStart || !dateEnd) {
    return false;
  }

  const nowDay = startOfUtcDay(now);
  return dateStart <= nowDay && dateEnd >= nowDay;
};

const computeActiveCpomStats = (
  cpomLinks: StatistiqueDbCpomStructure[],
  activeStructureIds: number[]
): { totalCpoms: number; structuresAvecCpom: number } => {
  const now = new Date();
  const activeStructureIdSet = new Set(activeStructureIds);
  const activeCpomIds = new Set<number>();
  const structureIdsWithActiveCpom = new Set<number>();

  for (const link of cpomLinks) {
    if (!activeStructureIdSet.has(link.structureId)) {
      continue;
    }
    if (!isCpomLinkActiveNow(link, now)) {
      continue;
    }
    activeCpomIds.add(link.cpomId);
    structureIdsWithActiveCpom.add(link.structureId);
  }

  return {
    totalCpoms: activeCpomIds.size,
    structuresAvecCpom: structureIdsWithActiveCpom.size,
  };
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
  return STRUCTURE_TYPES_DISPLAY_ORDER.filter(
    (structureType) =>
      !EXCLUDED_STRUCTURE_TYPES.includes(
        structureType as (typeof EXCLUDED_STRUCTURE_TYPES)[number]
      )
  ).map((structureType) => ({
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
): TypeStructureStat[] => {
  const statsByType = new Map<
    StructureType,
    { structures: number; places: number }
  >();

  for (const structure of structures) {
    const type = structure.type as StructureType | null;
    if (type === null) {
      continue;
    }
    const typologie = typologieMap.get(structure.id);
    const current = statsByType.get(type) ?? { structures: 0, places: 0 };
    statsByType.set(type, {
      structures: current.structures + 1,
      places: current.places + (typologie?.placesAutorisees ?? 0),
    });
  }

  return fillStructureTypes(
    Array.from(statsByType.entries()).map(([type, stats]) => ({
      type,
      ...stats,
    }))
  );
};

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
  // Aligné sur le global : une structure sans adresse répartie n'a pas de bâti
  structures.filter((structure) => batiMap.get(structure.id) === bati).length;

const computeByYearStats = (
  context: StatistiquesCpomYearContext,
  batiMap: Map<number, Repartition>
): StructuresByYearStat[] =>
  mapTypologieYears<StructuresByYearStat>(
    context.allStructures,
    context.activeStructureIdsByPeriod,
    context.typologies,
    (year, structuresForYear) => {
      const typologieMapForYear = getTypologieMapForExactYear(
        context.typologies,
        year
      );
      const structuresWithTypologie = filterStructuresWithTypologie(
        structuresForYear,
        typologieMapForYear
      );
      const structureIdsWithTypologie = new Set(
        structuresWithTypologie.map((structure) => structure.id)
      );

      return {
        totalStructures: structuresWithTypologie.length,
        totalCpoms: countActiveCpoms(
          context.cpomLinks,
          structureIdsWithTypologie,
          year
        ),
        structuresAvecCpom: countStructuresAvecCpomForYear(
          context.cpomLinks,
          structureIdsWithTypologie,
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
    }
  );

export const computeStructuresStatistiques = (
  context: StatistiquesContext
): StatistiqueApiRead["structures"] => {
  const {
    structures,
    typologies,
    adresses,
    cpomLinks,
    structureVersionTimeline,
  } = context;
  const typologieMap = getLastTypologiePerStructure(typologies);
  const now = new Date();
  // Le bâti (vue globale et byYear) reflète l'adresse actuelle : `adresses` remonte
  // désormais tout l'historique des versions, on résout ici la version effective à date.
  const currentAdresses = filterByEffectiveVersionAtDate(
    adresses,
    structures.map((structure) => structure.id),
    now,
    structureVersionTimeline,
    now
  );
  const batiMap = getBatiPerStructure(currentAdresses);
  const activeStructureIds = structures.map((structure) => structure.id);
  const { totalCpoms, structuresAvecCpom } = computeActiveCpomStats(
    cpomLinks,
    activeStructureIds
  );

  const structureBatis = computeBatiStats(structures, batiMap, currentAdresses);

  return {
    totalStructures: structures.length,
    // Places autorisées (typologie) - somme des `structureTypes[].places`.
    totalPlaces: computeTotalPlaces(structures, typologieMap),
    // Places à l'adresse (dernière version) - somme des `structureBatis[].places`.
    totalPlacesAdresse: structureBatis.reduce(
      (total, bati) => total + bati.places,
      0
    ),
    totalCpoms,
    structuresAvecCpom,
    structureTypes: computeTypeStats(structures, typologieMap),
    structureBatis,
    byYear: computeByYearStats(context, batiMap),
  };
};

export type StructuresYearIndicatorField =
  "totalStructures" | "structuresAvecCpom";

/** Computes a single byYear field for one year, for the cartographie one-indicator requests. */
export const computeStructuresIndicatorForYear = (
  context: StatistiquesCpomYearContext,
  year: number,
  field: StructuresYearIndicatorField
): number | null => {
  const resolved = resolveStructuresWithTypologieForYear(context, year);
  if (!resolved) {
    return null;
  }

  if (field === "totalStructures") {
    return resolved.structures.length;
  }

  return countStructuresAvecCpomForYear(
    context.cpomLinks,
    new Set(resolved.structures.map((structure) => structure.id)),
    year
  );
};
