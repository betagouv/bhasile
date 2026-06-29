import {
  StatistiqueApiRead,
  StatistiquesFilters,
} from "@/schemas/api/statistique.schema";

import { getActiviteStatistiques } from "./activite/activite.service";
import { getControleQualiteStatistiques } from "./controle-qualite/controle-qualite.service";
import { getFinanceStatistiques } from "./finance/finance.service";
import { getPlacesStatistiques } from "./places/places.service";
import type { StatistiquesContext } from "./statistiques.db.type";
import {
  findCpomStructures,
  findDepartementsWithPopulation,
  findDnaLinksByStructure,
  findEffectiveStructureVersionsAtDate,
  findFirstEffectiveDateByStructure,
  findStructureAdresses,
  findStructureTypologies,
} from "./statistiques.repository";
import {
  buildClosureDateByStructureId,
  buildStatistiquesYearContext,
  collectCandidateYears,
  getTypologieYears,
  mapVersionsToStructures,
} from "./statistiques.utils";
import { getStructuresStatistiques } from "./structures/structures.service";

export const buildStatistiquesContext = async (
  filters: StatistiquesFilters
): Promise<StatistiquesContext | null> => {
  const atDate = new Date();
  const referenceYear = atDate.getFullYear();
  const effectiveVersions = await findEffectiveStructureVersionsAtDate(
    filters,
    atDate
  );

  const allStructureIds = effectiveVersions
    .map((version) => version.structureId)
    .filter((id): id is number => id != null);

  if (allStructureIds.length === 0) {
    return null;
  }

  const openEffectiveVersions = effectiveVersions.filter(
    (version) => version.structureVersionTransformation?.type !== "FERMETURE"
  );

  const effectiveStructureVersionIds = effectiveVersions
    .map((version) => version.id)
    .filter((id): id is number => id != null);

  const allStructures = mapVersionsToStructures(effectiveVersions);
  const structures = mapVersionsToStructures(openEffectiveVersions);

  const [typologies, adresses, cpomLinks, dnaLinks, openingDateByStructureId] =
    await Promise.all([
      findStructureTypologies(allStructureIds),
      findStructureAdresses(effectiveStructureVersionIds),
      findCpomStructures(allStructureIds),
      findDnaLinksByStructure(allStructureIds),
      findFirstEffectiveDateByStructure(allStructureIds),
    ]);

  const closureDateByStructureId =
    buildClosureDateByStructureId(effectiveVersions);
  const yearContext = buildStatistiquesYearContext(
    allStructureIds,
    collectCandidateYears(
      allStructureIds,
      getTypologieYears(typologies),
      openingDateByStructureId,
      closureDateByStructureId,
      referenceYear
    ),
    openingDateByStructureId,
    closureDateByStructureId
  );

  const dnaCodes = [...new Set(dnaLinks.map((link) => link.dna.code))];

  const deptNumeros = [
    ...new Set(
      structures
        .map((structure) => structure.departementAdministratif)
        .filter((departement): departement is string => departement !== null)
    ),
  ];
  const departements = await findDepartementsWithPopulation(deptNumeros);

  return {
    structures,
    allStructures,
    yearContext,
    typologies,
    adresses,
    cpomLinks,
    dnaLinks,
    dnaCodes,
    departements,
  };
};

export const getStatistiques = async (
  filters: StatistiquesFilters
): Promise<StatistiqueApiRead | null> => {
  const context = await buildStatistiquesContext(filters);
  if (!context) {
    return null;
  }

  const { aggregation } = filters;

  const [structures, places, finance, controleQualite, activite] =
    await Promise.all([
      getStructuresStatistiques(context),
      getPlacesStatistiques(context),
      getFinanceStatistiques(context, aggregation),
      getControleQualiteStatistiques(context, aggregation),
      getActiviteStatistiques(context),
    ]);

  return {
    structures,
    places,
    finance,
    controleQualite,
    activite,
  };
};
