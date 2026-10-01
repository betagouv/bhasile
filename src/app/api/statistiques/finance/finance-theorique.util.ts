import { startOfNextUtcDay, startOfUtcDay } from "@/app/utils/date.util";
import { PLACES_VERSIONED_FROM_YEAR } from "@/constants";

import { pickVersionBefore } from "../../structure-versions/structure-version.util";
import type {
  StatistiqueDbStructure,
  StatistiqueDbStructureVersionTimeline,
  StatistiquesContext,
} from "../statistiques.db.type";

const DAY_IN_MS = 24 * 60 * 60 * 1000;

export type StructureJoursPlaces = {
  jours: number;
  joursPlaces: number;
};

type JoursPlacesContext = Pick<
  StatistiquesContext,
  "openingDateByStructureId" | "closureDateByStructureId"
>;

/**
 * Jours d'ouverture et jours x places d'une structure sur une année, bornés par
 * ses dates d'ouverture et de fermeture. À partir de `PLACES_VERSIONED_FROM_YEAR`,
 * les places suivent les versions de la structure (une transformation en cours
 * d'année découpe l'année) ; avant, le millésime de typologie vaut pour l'année.
 * L'année en cours est comptée en entier, avec les versions effectives à `now`.
 */
export const computeStructureJoursPlaces = (
  context: JoursPlacesContext,
  structureId: number,
  year: number,
  versions: StatistiqueDbStructureVersionTimeline[],
  placesTypologie: number | null,
  now: Date
): StructureJoursPlaces | null => {
  const yearStart = Date.UTC(year, 0, 1);
  const yearEnd = Date.UTC(year + 1, 0, 1);
  const openingDate = context.openingDateByStructureId.get(structureId);
  const closureDate = context.closureDateByStructureId.get(structureId);
  const start = openingDate
    ? Math.max(yearStart, startOfUtcDay(openingDate).getTime())
    : yearStart;
  const end = closureDate
    ? Math.min(yearEnd, startOfNextUtcDay(closureDate).getTime())
    : yearEnd;
  if (end <= start) {
    return null;
  }

  if (year < PLACES_VERSIONED_FROM_YEAR) {
    if (placesTypologie === null) {
      return null;
    }
    const jours = Math.round((end - start) / DAY_IN_MS);
    return { jours, joursPlaces: jours * placesTypologie };
  }

  const nowCutoff = startOfNextUtcDay(now).getTime();
  const effectiveVersions = versions.filter(
    (version) =>
      version.effectiveDate === null ||
      version.effectiveDate.getTime() < nowCutoff
  );
  const changeDays = effectiveVersions
    .flatMap((version) =>
      version.effectiveDate === null
        ? []
        : [startOfUtcDay(version.effectiveDate).getTime()]
    )
    .filter((changeDay) => changeDay > start && changeDay < end);
  const boundaries = [...new Set([start, ...changeDays, end])].sort(
    (boundaryA, boundaryB) => boundaryA - boundaryB
  );

  let jours = 0;
  let joursPlaces = 0;
  for (let index = 0; index < boundaries.length - 1; index += 1) {
    const places = pickVersionBefore(
      effectiveVersions,
      boundaries[index] + DAY_IN_MS
    )?.placesAutorisees;
    if (places == null) {
      continue;
    }
    const segmentJours = Math.round(
      (boundaries[index + 1] - boundaries[index]) / DAY_IN_MS
    );
    jours += segmentJours;
    joursPlaces += segmentJours * places;
  }

  return jours > 0 ? { jours, joursPlaces } : null;
};

type CiblesContext = Pick<
  StatistiquesContext,
  | "tarifsJournaliersCibles"
  | "tauxEncadrementCibles"
  | "idfDepartementNumeros"
  | "cadaFromHudaStructureIds"
>;

export type CiblesFinancieresLookup = {
  getTarifJournalierCible: (
    structure: StatistiqueDbStructure,
    year: number
  ) => number | null;
  getTauxEncadrementCible: (
    structure: StatistiqueDbStructure,
    year: number
  ) => number | null;
};

const toCibleKey = (
  structureType: string | null,
  year: number,
  isIdf: boolean,
  isFromHuda = false
): string => `${structureType}|${year}|${isIdf}|${isFromHuda}`;

/** Cibles par structure : selon son type, l'année, son zonage IDF et, pour le taux, son origine HUDA. */
export const buildCiblesFinancieresLookup = (
  context: CiblesContext
): CiblesFinancieresLookup => {
  const tarifByKey = new Map(
    context.tarifsJournaliersCibles.map((cible) => [
      toCibleKey(cible.structureType, cible.year, cible.isIdf),
      cible.tarifCible,
    ])
  );
  const tauxByKey = new Map(
    context.tauxEncadrementCibles.map((cible) => [
      toCibleKey(
        cible.structureType,
        cible.year,
        cible.isIdf,
        cible.isFromHuda
      ),
      cible.tauxCible,
    ])
  );
  const isIdf = (structure: StatistiqueDbStructure): boolean =>
    context.idfDepartementNumeros.has(structure.departementAdministratif);

  return {
    getTarifJournalierCible: (structure, year) =>
      tarifByKey.get(toCibleKey(structure.type, year, isIdf(structure))) ??
      null,
    getTauxEncadrementCible: (structure, year) =>
      tauxByKey.get(
        toCibleKey(
          structure.type,
          year,
          isIdf(structure),
          context.cadaFromHudaStructureIds.has(structure.id)
        )
      ) ?? null,
  };
};
