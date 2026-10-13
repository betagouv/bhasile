import { CompletudeStat } from "@/schemas/api/statistique.schema";

import { ACTUALISATION_FORM_SLUG_PREFIX } from "../forms/form.constants";
import type {
  StatistiqueDbFormDefinition,
  StatistiqueDbStructure,
  StatistiqueDbValidatedActualisation,
  StatistiquesCompletudeContext,
} from "./statistiques.db.type";

export const parseCampagneYear = (
  definition: StatistiqueDbFormDefinition
): number =>
  Number(definition.slug.slice(ACTUALISATION_FORM_SLUG_PREFIX.length));

const getCampagneYears = (
  definitions: StatistiqueDbFormDefinition[]
): number[] =>
  definitions
    .map(parseCampagneYear)
    .filter((year) => Number.isInteger(year))
    .sort((yearA, yearB) => yearA - yearB);

const FIRST_CAMPAGNE_LOOKBACK_YEARS = 1;
// Le réalisé financier d'une année N n'est demandé qu'à la campagne N + 2.
export const FINANCE_REALISE_LAG_YEARS = 2;

/**
 * Première année soumise aux campagnes. La frontière est posée une fois par la
 * première campagne jamais déclarée, qui reprend aussi les années juste avant
 * elle (aucune actualisation n'a eu lieu entre l'initialisation et cette
 * campagne). Les campagnes suivantes ne déplacent pas cette frontière.
 */
export const getFirstCampagneCoveredYear = (
  definitions: StatistiqueDbFormDefinition[],
  lagYears: number = 0
): number | null => {
  const campagneYears = getCampagneYears(definitions);
  return campagneYears.length > 0
    ? campagneYears[0] - Math.max(FIRST_CAMPAGNE_LOOKBACK_YEARS, lagYears)
    : null;
};

export const isYearUnderCampagne = (
  context: Pick<StatistiquesCompletudeContext, "actualisationFormDefinitions">,
  year: number,
  lagYears: number = 0
): boolean => {
  const firstCoveredYear = getFirstCampagneCoveredYear(
    context.actualisationFormDefinitions,
    lagYears
  );
  return firstCoveredYear !== null && year >= firstCoveredYear;
};

/**
 * Campagne à valider pour qu'une structure soit à jour sur une année : celle de
 * l'année, décalée de `lagYears` quand la donnée arrive plus tard, sans dépasser
 * la dernière campagne déclarée.
 */
const getRequiredCampagneYear = (
  definitions: StatistiqueDbFormDefinition[],
  year: number,
  lagYears: number
): number => {
  const lastCampagneYear = getCampagneYears(definitions).at(-1) ?? year;
  return Math.max(year, Math.min(year + lagYears, lastCampagneYear));
};

export const buildLastValidatedCampagneYearByStructureId = (
  validatedActualisations: StatistiqueDbValidatedActualisation[]
): Map<number, number> => {
  const lastValidatedYearByStructureId = new Map<number, number>();

  for (const actualisation of validatedActualisations) {
    if (actualisation.structureId === null) {
      continue;
    }
    const campagneYear = parseCampagneYear(actualisation.formDefinition);
    if (!Number.isInteger(campagneYear)) {
      continue;
    }
    const lastValidatedYear = lastValidatedYearByStructureId.get(
      actualisation.structureId
    );
    if (lastValidatedYear === undefined || campagneYear > lastValidatedYear) {
      lastValidatedYearByStructureId.set(
        actualisation.structureId,
        campagneYear
      );
    }
  }

  return lastValidatedYearByStructureId;
};

/** Valider une campagne atteste les données de toutes les années qu'elle couvre et des précédentes. */
const isStructureActualisee = (
  context: StatistiquesCompletudeContext,
  structureId: number,
  year: number,
  lagYears: number
): boolean => {
  const lastValidatedYear =
    context.lastValidatedCampagneYearByStructureId.get(structureId);
  return (
    lastValidatedYear !== undefined &&
    lastValidatedYear >=
      getRequiredCampagneYear(
        context.actualisationFormDefinitions,
        year,
        lagYears
      )
  );
};

/**
 * Structures attendues sur une année : encore ouvertes à la fin de l'année. Une
 * structure fermée en cours d'année n'a plus à être actualisée sur cette
 * année-là, ni sur les suivantes.
 */
export const resolveExpectedStructureIds = (
  context: StatistiquesCompletudeContext,
  structuresForYear: StatistiqueDbStructure[],
  year: number
): Set<number> => {
  const expectedStructureIds = new Set<number>();

  for (const structure of structuresForYear) {
    const closureDate = context.closureDateByStructureId.get(structure.id);
    if (closureDate != null && closureDate.getUTCFullYear() <= year) {
      continue;
    }
    expectedStructureIds.add(structure.id);
  }

  return expectedStructureIds;
};

/**
 * Structures comptabilisées sur une année, parmi celles actives cette année-là.
 * Sur une année d'initialisation, toutes. Sur une année de campagne, uniquement
 * celles qui ont validé leur actualisation : `nbRenseignees` est exactement le
 * nombre de structures retournées.
 */
export const resolveStructuresForYear = (
  context: StatistiquesCompletudeContext,
  structuresActiveInYear: StatistiqueDbStructure[],
  year: number,
  lagYears: number = 0
): {
  structures: StatistiqueDbStructure[];
  completude: CompletudeStat | null;
} => {
  if (!isYearUnderCampagne(context, year, lagYears)) {
    return { structures: structuresActiveInYear, completude: null };
  }

  const structures = structuresActiveInYear.filter((structure) =>
    isStructureActualisee(context, structure.id, year, lagYears)
  );
  const expectedStructureIds = resolveExpectedStructureIds(
    context,
    structuresActiveInYear,
    year
  );
  for (const structure of structures) {
    expectedStructureIds.add(structure.id);
  }

  const nbAttendues = expectedStructureIds.size;
  const nbRenseignees = structures.length;

  return {
    structures,
    completude: {
      isComplete: nbRenseignees >= nbAttendues,
      nbAttendues,
      nbRenseignees,
    },
  };
};
