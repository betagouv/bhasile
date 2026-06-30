import {
  StatistiqueApiRead,
  StatistiquesFilters,
} from "@/schemas/api/statistique.schema";

import { computeActiviteStatistiques } from "./activite/activite.util";
import { computeControleQualiteStatistiques } from "./controle-qualite/controle-qualite.util";
import { computeFinanceStatistiques } from "./finance/finance.util";
import { computePlacesStatistiques } from "./places/places.util";
import type { StatistiquesContext } from "./statistiques.db.type";
import {
  findActivites,
  findAllStructureIdsMatchingFilters,
  findBudgets,
  findCpomStructures,
  findDepartementsWithPopulation,
  findDnaLinks,
  findEffectiveStructureVersionsAtDate,
  findEigs,
  findEvaluations,
  findIndicateursFinanciers,
  findStructureActivityDates,
  findStructureAdresses,
  findStructureTypologies,
  findStructureVersionTimeline,
} from "./statistiques.repository";
import {
  buildActivityIndex,
  buildStatistiquesActivityContext,
  collectDistinctYears,
  createEmptyActiveStructureIdsByPeriod,
  getTypologieYears,
  mapVersionsToStructures,
} from "./statistiques.utils";
import { computeStructuresStatistiques } from "./structures/structures.util";

export const buildStatistiquesContext = async (
  filters: StatistiquesFilters
): Promise<StatistiquesContext | null> => {
  const now = new Date();
  const referenceYear = now.getUTCFullYear();

  const allStructureIds = await findAllStructureIdsMatchingFilters(filters);
  if (allStructureIds.length === 0) {
    return null;
  }

  const [effectiveVersions, structureActivityDates] = await Promise.all([
    findEffectiveStructureVersionsAtDate(filters, now),
    findStructureActivityDates(allStructureIds),
  ]);

  const activityContext = buildStatistiquesActivityContext(
    allStructureIds,
    structureActivityDates
  );

  const effectiveStructureVersionIds = effectiveVersions
    .map((version) => version.id)
    .filter((id): id is number => id != null);

  const allStructures = mapVersionsToStructures(effectiveVersions);

  const [typologies, adresses, cpomLinks, dnaLinks, structureVersionTimeline] =
    await Promise.all([
      findStructureTypologies(allStructureIds),
      findStructureAdresses(effectiveStructureVersionIds),
      findCpomStructures(allStructureIds),
      findDnaLinks(allStructureIds),
      findStructureVersionTimeline(allStructureIds),
    ]);

  const activeStructureIdsByPeriod = createEmptyActiveStructureIdsByPeriod();
  const dnaCodes = [...new Set(dnaLinks.map((link) => link.dna.code))];

  const [departements, eigs, evaluations, budgets, indicateurs, activites] =
    await Promise.all([
      findDepartementsWithPopulation([
        ...new Set(
          allStructures
            .map((structure) => structure.departementAdministratif)
            .filter(
              (departement): departement is string => departement !== null
            )
        ),
      ]),
      findEigs(dnaCodes),
      findEvaluations(allStructureIds),
      findBudgets(allStructureIds),
      findIndicateursFinanciers(allStructureIds),
      findActivites(dnaCodes),
    ]);

  const activeStructureIdsNow = buildActivityIndex(
    activityContext,
    activeStructureIdsByPeriod,
    {
      referenceDate: now,
      typologieYears: getTypologieYears(typologies),
      referenceYear,
      periodDates: [
        ...eigs.map((eig) => eig.evenementDate),
        ...evaluations.map((evaluation) => evaluation.date),
        ...activites.map((activite) => activite.date),
      ],
      financeYears: collectDistinctYears(budgets, indicateurs),
    }
  );
  const structures = allStructures.filter((structure) =>
    activeStructureIdsNow.has(structure.id)
  );

  return {
    structures,
    allStructures,
    activeStructureIdsNow,
    activeStructureIdsByPeriod,
    eigs,
    evaluations,
    typologies,
    adresses,
    cpomLinks,
    dnaLinks,
    structureVersionTimeline,
    departements,
    budgets,
    indicateurs,
    activites,
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

  return {
    structures: computeStructuresStatistiques(context),
    places: computePlacesStatistiques(context),
    finance: computeFinanceStatistiques(context, aggregation),
    controleQualite: computeControleQualiteStatistiques(context, aggregation),
    activite: computeActiviteStatistiques(context),
  };
};
