import { getNow } from "@/app/utils/now.util";
import {
  BatiStat,
  StatistiqueApiRead,
  StructuresByYearStat,
  TypeStructureStat,
} from "@/schemas/api/statistique.schema";
import { Repartition, REPARTITION_DISPLAY_ORDER } from "@/types/adresse.type";
import {
  ACCEPTED_STRUCTURE_TYPES,
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
  filterInitialisedStructures,
  filterStructuresWithTypologie,
  getLastTypologiePerStructure,
  getTypologieMapForExactYear,
  isCpomLinkActiveInYear,
  mapTypologieYears,
  resolveCountedStructuresForYear,
} from "../statistiques.util";

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
      isCpomLinkActiveInYear(link, year)
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
      isCpomLinkActiveInYear(link, year)
    ) {
      structuresWithActiveCpom.add(link.structureId);
    }
  }

  return structuresWithActiveCpom.size;
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
  return ACCEPTED_STRUCTURE_TYPES.map((structureType) => ({
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

const computeByYearStats = (
  context: StatistiquesCpomYearContext,
  batiMap: Map<number, Repartition>,
  currentAdresses: StatistiqueDbAdresse[]
): StructuresByYearStat[] =>
  mapTypologieYears<StructuresByYearStat>(
    context,
    (year, structuresForYear, completude) => {
      const typologieMapForYear = getTypologieMapForExactYear(
        context.typologies,
        year
      );
      // Année de campagne : exactement les structures actualisées, celles du score.
      const countedStructures = completude
        ? structuresForYear
        : filterStructuresWithTypologie(structuresForYear, typologieMapForYear);
      const countedStructureIds = new Set(
        countedStructures.map((structure) => structure.id)
      );

      return {
        structureTypes: computeTypeStats(
          countedStructures,
          typologieMapForYear
        ),
        structureBatis: computeBatiStats(
          countedStructures,
          batiMap,
          currentAdresses
        ),
        totalStructures: countedStructures.length,
        totalCpoms: countActiveCpoms(
          context.cpomLinks,
          countedStructureIds,
          year
        ),
        structuresAvecCpom: countStructuresAvecCpomForYear(
          context.cpomLinks,
          countedStructureIds,
          year
        ),
      };
    }
  );

export const computeStructuresStatistiques = (
  context: StatistiquesContext
): StatistiqueApiRead["structures"] => {
  const { typologies, adresses, cpomLinks, structureVersionTimeline } = context;
  const structures = filterInitialisedStructures(context.structures, context);
  const typologieMap = getLastTypologiePerStructure(typologies);
  const now = getNow();
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
  const activeStructureIds = new Set(
    structures.map((structure) => structure.id)
  );
  const currentYear = now.getUTCFullYear();

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
    totalCpoms: countActiveCpoms(cpomLinks, activeStructureIds, currentYear),
    structuresAvecCpom: countStructuresAvecCpomForYear(
      cpomLinks,
      activeStructureIds,
      currentYear
    ),
    structureTypes: computeTypeStats(structures, typologieMap),
    structureBatis,
    byYear: computeByYearStats(context, batiMap, currentAdresses),
  };
};

export type StructuresYearIndicatorField =
  "totalStructures" | "structuresAvecCpom";

/* Computes a single byYear field for one year, for the cartographie one-indicator requests. */
export const computeStructuresIndicatorForYear = (
  context: StatistiquesCpomYearContext,
  year: number,
  field: StructuresYearIndicatorField
): number | null => {
  if (!context.activeStructureIdsByPeriod.year.has(String(year))) {
    return null;
  }

  const { structures: structuresForYear } = resolveCountedStructuresForYear(
    context,
    year
  );

  if (field === "totalStructures") {
    return structuresForYear.length;
  }

  return countStructuresAvecCpomForYear(
    context.cpomLinks,
    new Set(structuresForYear.map((structure) => structure.id)),
    year
  );
};
