import { StatistiquesFilters } from "@/schemas/api/statistique.schema";
import {
  CartographieApiRead,
  CartographieSupportedGranularite,
  StatistiqueCartographieFilters,
} from "@/schemas/api/statistique-cartographie.schema";

import { buildStatistiquesContext } from "../statistique.service";
import { sliceStatistiquesContext } from "../statistiques.utils";
import { findAllDepartementsWithRegion } from "./cartographie.repository";
import {
  buildZoneDefinitions,
  computeEvolution,
  computeIndicateurValues,
  groupStructureIdsByDepartement,
  resolveZoneDepartementNumeros,
} from "./cartographie.util";

export const getCartographieStatistiques = async (
  filters: StatistiqueCartographieFilters & {
    granularite: CartographieSupportedGranularite;
  }
): Promise<CartographieApiRead> => {
  const { granularite, indicateur, annee, aggregation } = filters;

  const allDepartements = await findAllDepartementsWithRegion();

  const departementNumerosRestriction =
    resolveZoneDepartementNumeros(filters);

  const zoneDefinitions = buildZoneDefinitions(
    granularite,
    allDepartements,
    departementNumerosRestriction
  );

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
      zones: zoneDefinitions.map((zone) => ({
        code: zone.code,
        name: zone.name,
        value: null,
        evolution: null,
      })),
    };
  }

  const structureIdsByDepartement = groupStructureIdsByDepartement(
    context.allStructures
  );

  const zones = zoneDefinitions.map((zone) => {
    const zoneStructureIds = new Set<number>();
    for (const departementNumero of zone.departementNumeros) {
      for (const structureId of structureIdsByDepartement.get(
        departementNumero
      ) ?? []) {
        zoneStructureIds.add(structureId);
      }
    }

    if (zoneStructureIds.size === 0) {
      return { code: zone.code, name: zone.name, value: null, evolution: null };
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
