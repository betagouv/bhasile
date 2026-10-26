import { getNow } from "@/app/utils/now.util";
import {
  getReadableDepartementNumeros,
  getReadableStructureWhere,
} from "@/lib/casl";
import {
  StatistiqueApiRead,
  StatistiquesFilters,
} from "@/schemas/api/statistique.schema";
import { SessionUser } from "@/types/global";

import { resolveGlobalFilters } from "../operateurs/operateur-filters.service";
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
  toStatistiquesPerimeterFilters,
} from "./statistiques.util";
import { computeStructuresStatistiques } from "./structures/structures.util";

export const buildStatistiquesContext = async (
  filters: StatistiquesFilters,
  user: SessionUser
): Promise<StatistiquesContext | null> => {
  const now = getNow();
  const referenceYear = now.getUTCFullYear();

  const resolvedFilters = toStatistiquesPerimeterFilters(
    await resolveGlobalFilters(filters)
  );
  const readableDepartements = getReadableDepartements(
    resolvedFilters.departements,
    getReadableDepartementNumeros(user)
  );
  const allStructures = await findPerimeterStructures(
    resolvedFilters,
    getReadableStructureWhere(user),
    now
  );
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

  const timelineByStructureId = indexTimelineByStructureId(
    structureVersionTimeline
  );
  const resolvedTypologies = applyVersionedPlacesToTypologies(
    typologies.filter((typologie) => typologie.year <= referenceYear),
    timelineByStructureId,
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
    findDepartementsWithPopulation([...(readableDepartements ?? [])]),
    findEigs(dnaCodes),
    findEvaluations(allStructureIds),
    findBudgets(allStructureIds),
    findCpomBudgets([...new Set(cpomLinks.map((link) => link.cpomId))]),
    findIndicateursFinanciers(allStructureIds),
    findActivites(dnaCodes),
    resolvedFilters.operateurIds === null && filters.types === null
      ? findRmus(readableDepartements)
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
    timelineByStructureId,
    departements,
    budgets,
    cpomBudgetByKey: indexCpomBudgets(cpomBudgets),
    indicateurs,
    activites,
    rmus,
    resolveDnaStructureIds: buildDnaStructureIdsResolver(
      dnaLinks,
      timelineByStructureId
    ),
  };
};

const getReadableDepartements = (
  filteredDepartements: Set<string> | null,
  readableDepartements: Set<string> | null
): Set<string> | null => {
  if (!filteredDepartements || !readableDepartements) {
    return filteredDepartements ?? readableDepartements;
  }
  return new Set(
    [...filteredDepartements].filter((departement) =>
      readableDepartements.has(departement)
    )
  );
};

export const getStatistiques = async (
  filters: StatistiquesFilters,
  user: SessionUser
): Promise<StatistiqueApiRead | null> => {
  const context = await buildStatistiquesContext(filters, user);
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
