import { StatistiquesFilters } from "@/schemas/api/statistique.schema";
import {
  CartographieApiRead,
  CartographieSupportedGranularite,
  CartographieZoneStat,
  StatistiqueCartographieFilters,
} from "@/schemas/api/statistique-cartographie.schema";

import { buildStatistiquesContext } from "../statistique.service";
import { sliceStatistiquesContext } from "../statistiques.utils";
import {
  findAllDepartementsWithRegion,
  findAllRegions,
} from "./cartographie.repository";
import {
  buildZoneDefinitions,
  computeEvolution,
  computeIndicateurValues,
  groupStructureIdsByDepartement,
  resolveZoneDepartementNumeros,
} from "./cartographie.util";

const buildEmptyZoneStat = (
  zone: { code: string; name: string }
): CartographieZoneStat => ({
  code: zone.code,
  name: zone.name,
  value: null,
  evolution: null,
});

export const getCartographieStatistiques = async (
  filters: StatistiqueCartographieFilters & {
    granularite: CartographieSupportedGranularite;
  }
): Promise<CartographieApiRead> => {
  const { granularite, indicateur, annee, aggregation } = filters;

  const [allDepartements, allRegions] = await Promise.all([
    findAllDepartementsWithRegion(),
    findAllRegions(),
  ]);

  const departementNumerosRestriction = resolveZoneDepartementNumeros(
    filters,
    allDepartements
  );

  const zoneDefinitions = buildZoneDefinitions(
    granularite,
    allDepartements,
    allRegions,
    departementNumerosRestriction
  );

  // Zone restriction matches no known departement: nothing to return.
  if (departementNumerosRestriction && departementNumerosRestriction.size === 0) {
    return { granularite, indicateur, annee, zones: [] };
  }

  const perimeterFilters: StatistiquesFilters = {
    departements: departementNumerosRestriction
      ? [...departementNumerosRestriction].join(",")
      : null,
    operateurs: filters.operateurs,
    types: filters.types,
    aggregation,
  };

  const context = await buildStatistiquesContext(perimeterFilters);

  if (!context) {
    return {
      granularite,
      indicateur,
      annee,
      zones: zoneDefinitions.map(buildEmptyZoneStat),
    };
  }

  const structureIdsByDepartement = groupStructureIdsByDepartement(
    context.allStructures
  );

  const zones = zoneDefinitions.map((zone) => {
    const zoneStructureIds = new Set<number>();
    for (const departementNumero of zone.departementNumeros) {
      for (const structureId of structureIdsByDepartement.get(departementNumero) ??
        []) {
        zoneStructureIds.add(structureId);
      }
    }

    if (zoneStructureIds.size === 0) {
      return buildEmptyZoneStat(zone);
    }

    const zoneContext = sliceStatistiquesContext(
      context,
      zoneStructureIds,
      new Set(zone.departementNumeros)
    );
    const { value, previousValue } = computeIndicateurValues(
      zoneContext,
      indicateur,
      annee,
      aggregation
    );

    return {
      code: zone.code,
      name: zone.name,
      value,
      evolution: computeEvolution(value, previousValue),
    };
  });

  return { granularite, indicateur, annee, zones };
};
