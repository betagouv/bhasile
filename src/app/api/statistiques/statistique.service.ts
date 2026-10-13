import { getNow } from "@/app/utils/now.util";
import {
  StatistiqueApiRead,
  StatistiquesFilters,
} from "@/schemas/api/statistique.schema";

import { computeActiviteStatistiques } from "./activite/activite.util";
import { buildLastValidatedCampagneYearByStructureId } from "./completude.util";
import { computeControleQualiteStatistiques } from "./controle-qualite/controle-qualite.util";
import {
  computeFinanceStatistiques,
  indexCpomBudgets,
} from "./finance/finance.util";
import { buildCiblesFinancieresLookup } from "./finance/finance-theorique.util";
import { computePlacesStatistiques } from "./places/places.util";
import { computeRmuStatistiques } from "./rmu/rmu.util";
import type { StatistiquesContext } from "./statistiques.db.type";
import {
  findActivites,
  findActualisationFormDefinitions,
  findBudgets,
  findCpomBudgets,
  findCpomStructures,
  findDepartementsWithPopulation,
  findDnaLinks,
  findEigs,
  findEvaluations,
  findIdfDepartementNumeros,
  findIndicateursFinanciers,
  findOperateurFiliales,
  findPerimeterStructures,
  findRmus,
  findStructureActivityDates,
  findStructureAdresses,
  findStructureInitialisations,
  findStructureTypologies,
  findStructureVersionTimeline,
  findTarifsJournaliersCibles,
  findTauxEncadrementCibles,
  findValidatedActualisationForms,
} from "./statistiques.repository";
import {
  applyVersionedPlacesToTypologies,
  buildActivityIndex,
  buildDnaStructureIdsResolver,
  buildStatistiquesActivityContext,
  collectDistinctYears,
  createEmptyActiveStructureIdsByPeriod,
  getCadaFromHudaStructureIds,
  getInitialisedStructureIds,
  getTypologieYears,
  indexTimelineByStructureId,
  parseStatistiquesPerimeterFilters,
  type StatistiquesResolvedPerimeterFilters,
} from "./statistiques.util";
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
  const now = getNow();
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

  const [
    typologies,
    adresses,
    cpomLinks,
    dnaLinks,
    structureVersionTimeline,
    structureInitialisations,
    actualisationFormDefinitions,
    validatedActualisations,
    idfDepartementNumeros,
    tarifsJournaliersCibles,
    tauxEncadrementCibles,
  ] = await Promise.all([
    findStructureTypologies(allStructureIds),
    findStructureAdresses(allStructureIds),
    findCpomStructures(allStructureIds),
    findDnaLinks(allStructureIds),
    findStructureVersionTimeline(allStructureIds),
    findStructureInitialisations(allStructureIds),
    findActualisationFormDefinitions(),
    findValidatedActualisationForms(allStructureIds),
    findIdfDepartementNumeros(),
    findTarifsJournaliersCibles(),
    findTauxEncadrementCibles(),
  ]);

  const resolvedTypologies = applyVersionedPlacesToTypologies(
    typologies.filter((typologie) => typologie.year <= referenceYear),
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
    cpomBudgets,
    indicateurs,
    activites,
    rmus,
  ] = await Promise.all([
    findDepartementsWithPopulation([...(resolvedFilters.departements ?? [])]),
    findEigs(dnaCodes),
    findEvaluations(allStructureIds),
    findBudgets(allStructureIds),
    findCpomBudgets([...new Set(cpomLinks.map((link) => link.cpomId))]),
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
      financeYears: collectDistinctYears(budgets, cpomBudgets, indicateurs),
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
    initialisedStructureIds: getInitialisedStructureIds(
      structureInitialisations,
      now
    ),
    openingDateByStructureId: activityContext.openingDateByStructureId,
    closureDateByStructureId: activityContext.closureDateByStructureId,
    actualisationFormDefinitions,
    lastValidatedCampagneYearByStructureId:
      buildLastValidatedCampagneYearByStructureId(validatedActualisations),
    ciblesFinancieres: buildCiblesFinancieresLookup({
      tarifsJournaliersCibles,
      tauxEncadrementCibles,
      idfDepartementNumeros: new Set(idfDepartementNumeros),
      cadaFromHudaStructureIds: getCadaFromHudaStructureIds(
        structureInitialisations
      ),
    }),
    eigs,
    evaluations,
    typologies: resolvedTypologies,
    adresses,
    cpomLinks,
    dnaLinks,
    structureVersionTimeline,
    timelineByStructureId: indexTimelineByStructureId(structureVersionTimeline),
    departements,
    budgets,
    cpomBudgetByKey: indexCpomBudgets(cpomBudgets),
    indicateurs,
    activites,
    rmus,
    resolveDnaStructureIds: buildDnaStructureIdsResolver(
      dnaLinks,
      structureVersionTimeline
    ),
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
