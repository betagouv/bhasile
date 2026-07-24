import {
  StatistiqueApiRead,
  StatistiquesFilters,
} from "@/schemas/api/statistique.schema";

import { computeActiviteStatistiques } from "./activite/activite.util";
import { computeControleQualiteStatistiques } from "./controle-qualite/controle-qualite.util";
import { computeFinanceStatistiques } from "./finance/finance.util";
import { computePlacesStatistiques } from "./places/places.util";
import { computeRmuStatistiques } from "./rmu/rmu.util";
import type { StatistiquesContext } from "./statistiques.db.type";
import {
  findActivites,
  findBudgets,
  findCpomStructures,
  findDepartementsWithPopulation,
  findDnaLinks,
  findEigs,
  findEvaluations,
  findIndicateursFinanciers,
  findOperateurFiliales,
  findPerimeterStructures,
  findRmus,
  findStructureActivityDates,
  findStructureAdresses,
  findStructureTypologies,
  findStructureVersionTimeline,
} from "./statistiques.repository";
import {
  applyVersionedPlacesToTypologies,
  buildActivityIndex,
  buildStatistiquesActivityContext,
  collectDistinctYears,
  createEmptyActiveStructureIdsByPeriod,
  getTypologieYears,
  parseStatistiquesPerimeterFilters,
  type StatistiquesResolvedPerimeterFilters,
} from "./statistiques.utils";
import { computeStructuresStatistiques } from "./structures/structures.util";

/** Résout les filiales des `operateurs` filtrés (seul point d'accès BDD du filtrage). */
const resolveStatistiquesPerimeterFilters = async (
  filters: StatistiquesFilters
): Promise<StatistiquesResolvedPerimeterFilters> => {
  const parsed = parseStatistiquesPerimeterFilters(filters);
  const filiales = await findOperateurFiliales(parsed.operateurIds);

  return {
    departements: parsed.departements,
    types: parsed.types,
    operateurIds:
      parsed.operateurIds.length > 0
        ? new Set([
            ...parsed.operateurIds,
            ...filiales.map((filiale) => filiale.id),
          ])
        : null,
  };
};

export const buildStatistiquesContext = async (
  filters: StatistiquesFilters
): Promise<StatistiquesContext | null> => {
  const now = new Date();
  const referenceYear = now.getUTCFullYear();

  const resolvedFilters = await resolveStatistiquesPerimeterFilters(filters);
  const allStructures = await findPerimeterStructures(resolvedFilters, now);
  const allStructureIds = allStructures.map((structure) => structure.id);
  if (allStructureIds.length === 0) {
    return null;
  }

  const structureActivityDates =
    await findStructureActivityDates(allStructureIds);

  const activityContext = buildStatistiquesActivityContext(
    allStructureIds,
    structureActivityDates
  );

  const [typologies, adresses, cpomLinks, dnaLinks, structureVersionTimeline] =
    await Promise.all([
      findStructureTypologies(allStructureIds),
      findStructureAdresses(allStructureIds),
      findCpomStructures(allStructureIds),
      findDnaLinks(allStructureIds),
      findStructureVersionTimeline(allStructureIds),
    ]);

  const resolvedTypologies = applyVersionedPlacesToTypologies(
    typologies,
    structureVersionTimeline,
    now
  );

  const activeStructureIdsByPeriod = createEmptyActiveStructureIdsByPeriod();
  const dnaCodes = [...new Set(dnaLinks.map((link) => link.dna.code))];

  const [
    departements,
    eigs,
    evaluations,
    budgets,
    indicateurs,
    activites,
    rmus,
  ] = await Promise.all([
    findDepartementsWithPopulation([
      ...new Set(
        allStructures
          .map((structure) => structure.departementAdministratif)
          .filter((departement): departement is string => departement !== null)
      ),
    ]),
    findEigs(dnaCodes),
    findEvaluations(allStructureIds),
    findBudgets(allStructureIds),
    findIndicateursFinanciers(allStructureIds),
    findActivites(dnaCodes),
    resolvedFilters.operateurIds === null && filters.types === null
      ? findRmus(resolvedFilters.departements)
      : Promise.resolve(null),
  ]);

  const activeStructureIdsNow = buildActivityIndex(
    activityContext,
    activeStructureIdsByPeriod,
    {
      referenceDate: now,
      typologieYears: getTypologieYears(resolvedTypologies),
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
    typologies: resolvedTypologies,
    adresses,
    cpomLinks,
    dnaLinks,
    structureVersionTimeline,
    departements,
    budgets,
    indicateurs,
    activites,
    rmus,
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
    rmu: computeRmuStatistiques(context),
  };
};
