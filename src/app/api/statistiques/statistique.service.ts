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
  findStructureAdresses,
  findStructureTypologies,
} from "./statistiques.repository";
import { getStructuresStatistiques } from "./structures/structures.service";

export const buildStatistiquesContext = async (
  filters: StatistiquesFilters
): Promise<StatistiquesContext | null> => {
  const atDate = new Date();
  const effectiveVersions = await findEffectiveStructureVersionsAtDate(
    filters,
    atDate
  );

  // A structure is considered closed if its effective version at date is linked to a FERMETURE block.
  const openEffectiveVersions = effectiveVersions.filter(
    (version) => version.structureVersionTransformation?.type !== "FERMETURE"
  );

  const structureIds = openEffectiveVersions
    .map((version) => version.structureId)
    .filter((id): id is number => id != null);

  if (structureIds.length === 0) {
    return null;
  }

  const effectiveStructureVersionIds = openEffectiveVersions
    .map((version) => version.id)
    .filter((id): id is number => id != null);

  const structures = openEffectiveVersions
    .filter(
      (version): version is typeof version & { structureId: number } =>
        version.structureId != null
    )
    .map((version) => ({
      id: version.structureId,
      type: version.type,
      departementAdministratif: version.departementAdministratif,
    }));

  const [typologies, adresses, cpomLinks, dnaLinks] = await Promise.all([
    findStructureTypologies(structureIds),
    findStructureAdresses(effectiveStructureVersionIds),
    findCpomStructures(structureIds),
    findDnaLinksByStructure(structureIds),
  ]);

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
    structureIds,
    structures,
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
