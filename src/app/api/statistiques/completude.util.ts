import { getNow } from "@/app/utils/now.util";
import {
  CompletudeReason,
  CompletudeStat,
} from "@/schemas/api/statistique.schema";

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

export const FIRST_CAMPAGNE_LOOKBACK_YEARS = 1;
// Le réalisé financier de l'année N-2 n'est saisi qu'à la première campagne.
export const FIRST_CAMPAGNE_FINANCE_LOOKBACK_YEARS = 2;

/**
 * Première année soumise aux campagnes. La frontière est posée une fois par la
 * première campagne jamais déclarée, qui reprend aussi les années juste avant
 * elle (aucune actualisation n'a eu lieu entre l'initialisation et cette
 * campagne). Les campagnes suivantes ne déplacent pas cette frontière.
 */
export const getFirstCampagneCoveredYear = (
  definitions: StatistiqueDbFormDefinition[],
  lookbackYears: number = FIRST_CAMPAGNE_LOOKBACK_YEARS
): number | null => {
  const campagneYears = getCampagneYears(definitions);
  return campagneYears.length > 0 ? campagneYears[0] - lookbackYears : null;
};

export const isYearUnderCampagne = (
  context: Pick<StatistiquesCompletudeContext, "actualisationFormDefinitions">,
  year: number,
  lookbackYears: number = FIRST_CAMPAGNE_LOOKBACK_YEARS
): boolean => {
  const firstCoveredYear = getFirstCampagneCoveredYear(
    context.actualisationFormDefinitions,
    lookbackYears
  );
  return firstCoveredYear !== null && year >= firstCoveredYear;
};

const isCampagneOpenForYear = (
  definitions: StatistiqueDbFormDefinition[],
  year: number,
  now: Date
): boolean =>
  definitions.some((definition) => {
    const campagneYear = parseCampagneYear(definition);
    if (!Number.isInteger(campagneYear) || campagneYear < year) {
      return false;
    }
    return definition.deadline === null || definition.deadline >= now;
  });

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

/** Valider la campagne N atteste les données de toutes les années jusqu'à N incluse. */
const isStructureActualisee = (
  context: StatistiquesCompletudeContext,
  structureId: number,
  year: number
): boolean => {
  const lastValidatedYear =
    context.lastValidatedCampagneYearByStructureId.get(structureId);
  return lastValidatedYear !== undefined && lastValidatedYear >= year;
};

/**
 * Structures attendues sur une année : encore ouvertes à la fin de l'année (le
 * périmètre ne contient que des structures initialisées). Une structure fermée en cours d'année n'a plus à être actualisée
 * sur cette année-là, ni sur les suivantes.
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
  now: Date = getNow(),
  lookbackYears: number = FIRST_CAMPAGNE_LOOKBACK_YEARS
): {
  structures: StatistiqueDbStructure[];
  completude: CompletudeStat | null;
} => {
  if (!isYearUnderCampagne(context, year, lookbackYears)) {
    return { structures: structuresActiveInYear, completude: null };
  }

  const structures = structuresActiveInYear.filter((structure) =>
    isStructureActualisee(context, structure.id, year)
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
  const isComplete = nbRenseignees >= nbAttendues;

  return {
    structures,
    completude: {
      isComplete,
      reason: isComplete
        ? null
        : isCampagneOpenForYear(context.actualisationFormDefinitions, year, now)
          ? CompletudeReason.SAISIE_EN_COURS
          : CompletudeReason.SAISIE_INCOMPLETE,
      nbAttendues,
      nbRenseignees,
    },
  };
};
