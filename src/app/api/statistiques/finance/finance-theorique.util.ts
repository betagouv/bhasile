import { startOfNextUtcDay, startOfUtcDay } from "@/app/utils/date.util";
import { PLACES_VERSIONED_FROM_YEAR } from "@/constants";
import { StructureType, TransformationType } from "@/generated/prisma/client";

import {
  compareMostRecentFirst,
  pickVersionBefore,
} from "../../structure-versions/structure-version.util";
import type {
  CiblesFinancieresLookup,
  StatistiqueDbStructure,
  StatistiqueDbStructureVersionTimeline,
  StatistiqueDbTarifJournalierCible,
  StatistiqueDbTauxEncadrementCible,
  StatistiquesContext,
} from "../statistiques.db.type";
import { countDaysBetween, getStructureOpenBounds } from "../statistiques.util";

export type StructureJoursPlaces = {
  jours: number;
  joursPlaces: number;
  joursPlacesHuda: number;
};

type JoursPlacesContext = Pick<
  StatistiquesContext,
  "openingDateByStructureId" | "closureDateByStructureId"
>;

const HUDA_VERS_CADA_TRANSFORMATION_TYPES: TransformationType[] = [
  TransformationType.TRANSFO_HUDA_FERMETURE_VERS_CADA_EXISTANT,
  TransformationType.TRANSFO_HUDA_FERMETURE_VERS_CADA_NOUVEAU,
  TransformationType.TRANSFO_HUDA_CONTRACTION_VERS_CADA_EXISTANT,
  TransformationType.TRANSFO_HUDA_CONTRACTION_VERS_CADA_NOUVEAU,
];

const isHudaVersCadaVersion = (
  version: StatistiqueDbStructureVersionTimeline
): boolean => {
  const transformationType =
    version.structureVersionTransformation?.transformation.type;
  return (
    transformationType !== undefined &&
    HUDA_VERS_CADA_TRANSFORMATION_TYPES.includes(transformationType)
  );
};

/** Places venues d'un HUDA par version : gain de places des versions HUDA vers CADA, réduit au prorata quand la structure perd des places. */
const buildPlacesHudaByVersionId = (
  versions: StatistiqueDbStructureVersionTimeline[]
): Map<number, number> => {
  const placesHudaByVersionId = new Map<number, number>();
  let previousPlaces = 0;
  let placesHuda = 0;
  const chronologicalVersions = [...versions].sort((versionA, versionB) =>
    compareMostRecentFirst(versionB, versionA)
  );
  for (const version of chronologicalVersions) {
    const places = version.placesAutorisees;
    if (places != null) {
      if (places < previousPlaces) {
        placesHuda = Math.round((placesHuda * places) / previousPlaces);
      } else if (isHudaVersCadaVersion(version)) {
        placesHuda += places - previousPlaces;
      }
      previousPlaces = places;
    }
    placesHudaByVersionId.set(version.id, placesHuda);
  }
  return placesHudaByVersionId;
};

/**
 * Jours d'ouverture, jours x places et jours x places venues d'un HUDA d'une structure
 * sur une année, bornés par ses dates d'ouverture et de fermeture. À partir de
 * `PLACES_VERSIONED_FROM_YEAR`, les places suivent les versions de la structure ;
 * avant, le millésime de typologie vaut pour l'année. L'année en cours est comptée
 * en entier, avec les versions effectives à `now`.
 */
export const computeStructureJoursPlaces = (
  context: JoursPlacesContext,
  structureId: number,
  year: number,
  versions: StatistiqueDbStructureVersionTimeline[],
  placesTypologie: number | null,
  now: Date
): StructureJoursPlaces | null => {
  const bounds = getStructureOpenBounds(
    context,
    structureId,
    new Date(Date.UTC(year, 0, 1)),
    new Date(Date.UTC(year + 1, 0, 1))
  );
  if (!bounds) {
    return null;
  }
  const start = bounds.start.getTime();
  const end = bounds.end.getTime();

  if (year < PLACES_VERSIONED_FROM_YEAR) {
    if (placesTypologie === null) {
      return null;
    }
    const jours = countDaysBetween(bounds.start, bounds.end);
    return { jours, joursPlaces: jours * placesTypologie, joursPlacesHuda: 0 };
  }

  const nowCutoff = startOfNextUtcDay(now).getTime();
  const effectiveVersions = versions.filter(
    (version) =>
      version.effectiveDate === null ||
      version.effectiveDate.getTime() < nowCutoff
  );
  const placesHudaByVersionId = buildPlacesHudaByVersionId(effectiveVersions);
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
  let joursPlacesHuda = 0;
  for (let index = 0; index < boundaries.length - 1; index += 1) {
    const version = pickVersionBefore(
      effectiveVersions,
      startOfNextUtcDay(new Date(boundaries[index])).getTime()
    );
    const places = version?.placesAutorisees;
    if (version == null || places == null) {
      continue;
    }
    const segmentJours = countDaysBetween(
      new Date(boundaries[index]),
      new Date(boundaries[index + 1])
    );
    jours += segmentJours;
    joursPlaces += segmentJours * places;
    joursPlacesHuda +=
      segmentJours * (placesHudaByVersionId.get(version.id) ?? 0);
  }

  return jours > 0 ? { jours, joursPlaces, joursPlacesHuda } : null;
};

/** Places moyennes / ETP cibles moyens : les places venues d'un HUDA restent au taux HUDA. */
export const computeTauxEncadrementCible = (
  ciblesFinancieres: CiblesFinancieresLookup,
  structureType: StructureType | null,
  joursPlaces: StructureJoursPlaces | null
): number | null => {
  const tauxStructure =
    ciblesFinancieres.getTauxEncadrementCible(structureType);
  if (tauxStructure === null || !joursPlaces?.joursPlacesHuda) {
    return tauxStructure;
  }
  const tauxHuda = ciblesFinancieres.getTauxEncadrementCible(
    StructureType.HUDA
  );
  if (tauxHuda === null) {
    return null;
  }
  const joursEtpCible =
    (joursPlaces.joursPlaces - joursPlaces.joursPlacesHuda) / tauxStructure +
    joursPlaces.joursPlacesHuda / tauxHuda;
  return joursPlaces.joursPlaces / joursEtpCible;
};

type CiblesFinancieresInputs = {
  tarifsJournaliersCibles: StatistiqueDbTarifJournalierCible[];
  tauxEncadrementCibles: StatistiqueDbTauxEncadrementCible[];
  idfDepartementNumeros: Set<string>;
};

const toCibleKey = (
  structureType: string | null,
  year: number,
  isIdf: boolean
): string => `${structureType}|${year}|${isIdf}`;

/** Tarif cible selon le type, l'année et le zonage IDF ; taux cible selon le type seul. */
export const buildCiblesFinancieresLookup = (
  inputs: CiblesFinancieresInputs
): CiblesFinancieresLookup => {
  const tarifByKey = new Map(
    inputs.tarifsJournaliersCibles.map((cible) => [
      toCibleKey(cible.structureType, cible.year, cible.isIdf),
      cible.tarifCible,
    ])
  );
  const tauxByStructureType = new Map(
    inputs.tauxEncadrementCibles.map((cible) => [
      cible.structureType,
      cible.tauxCible,
    ])
  );
  const isIdf = (structure: StatistiqueDbStructure): boolean =>
    inputs.idfDepartementNumeros.has(structure.departementAdministratif);

  return {
    getTarifJournalierCible: (structure, year) =>
      tarifByKey.get(toCibleKey(structure.type, year, isIdf(structure))) ??
      null,
    getTauxEncadrementCible: (structureType) =>
      (structureType && tauxByStructureType.get(structureType)) ?? null,
  };
};
