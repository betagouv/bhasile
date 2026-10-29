import { startOfNextUtcDay, startOfUtcDay } from "@/app/utils/date.util";
import { PLACES_VERSIONED_FROM_YEAR } from "@/constants";

import { pickVersionBefore } from "../../structure-versions/structure-version.util";
import type {
  CiblesFinancieresLookup,
  StatistiqueDbStructure,
  StatistiqueDbStructureVersionTimeline,
  StatistiqueDbTarifJournalierCible,
  StatistiqueDbTauxEncadrementCible,
  StatistiquesContext,
} from "../statistiques.db.type";
import { countDaysBetween, getStructureOpenBounds } from "../statistiques.util";

type StructureJoursPlaces = {
  jours: number;
  joursPlaces: number;
};

type JoursPlacesContext = Pick<
  StatistiquesContext,
  "openingDateByStructureId" | "closureDateByStructureId"
>;

type JoursPlacesContextExtended = JoursPlacesContext & {
  structureVersionTransformations: Map<
    number,
    { transformationId: number; type: string }
  >;
};

/** Jours d'ouverture et jours x places d'une structure sur une année. */
export const computeStructureJoursPlaces = (
  context: JoursPlacesContext | JoursPlacesContextExtended,
  structureId: number,
  year: number,
  versions: StatistiqueDbStructureVersionTimeline[],
  placesTypologie: number | null,
  now: Date,
  // Nouveaux paramètres pour le calcul de etpCible (optionnels pour compatibilité)
  ciblesFinancieres?: CiblesFinancieresLookup,
  structureType?: string | null
): StructureJoursPlaces & { etpCible: number | null } | null => {
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
    const joursPlaces = jours * placesTypologie;
    const etpCible = ciblesFinancieres && structureType
      ? (() => {
          const taux = ciblesFinancieres.getTauxByType(structureType);
          return taux !== null ? (jours * placesTypologie) / taux : null;
        })()
      : null;
    return { jours, joursPlaces, etpCible };
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
  let etpCibleTotal = 0;
  
  const isExtendedContext = (ctx: JoursPlacesContext | JoursPlacesContextExtended): 
    ctx is JoursPlacesContextExtended => 
    'structureVersionTransformations' in ctx;
  
  for (let index = 0; index < boundaries.length - 1; index += 1) {
    const currentVersion = pickVersionBefore(
      effectiveVersions,
      startOfNextUtcDay(new Date(boundaries[index])).getTime()
    );
    
    if (currentVersion == null) {
      continue;
    }
    
    const places = currentVersion.placesAutorisees;
    if (places == null) {
      continue;
    }
    
    const segmentJours = countDaysBetween(
      new Date(boundaries[index]),
      new Date(boundaries[index + 1])
    );
    
    jours += segmentJours;
    joursPlaces += segmentJours * places;
    
    if (ciblesFinancieres && structureType) {
      let tauxApplicable = ciblesFinancieres.getTauxByType(structureType);
      
      if (isExtendedContext(context) && currentVersion.structureVersionTransformationId) {
        const svt = context.structureVersionTransformations.get(
          currentVersion.structureVersionTransformationId
        );
        if (svt?.type?.startsWith("TRANSFO_HUDA")) {
          tauxApplicable = ciblesFinancieres.getTauxByType("HUDA");
        }
      }
      
      if (tauxApplicable != null) {
        etpCibleTotal += (places * segmentJours) / tauxApplicable;
      }
    }
  }

  const etpCible = jours > 0 && etpCibleTotal > 0 
    ? etpCibleTotal / jours 
    : null;
    
  return { jours, joursPlaces, etpCible };
};

type CiblesFinancieresInputs = {
  tarifsJournaliersCibles: StatistiqueDbTarifJournalierCible[];
  tauxEncadrementCibles: StatistiqueDbTauxEncadrementCible[];
  idfDepartementNumeros: Set<string>;
  cadaFromHudaStructureIds: Set<number>;
};

const toCibleKey = (
  structureType: string | null,
  year: number,
  isIdf: boolean,
  isFromHuda = false
): string => `${structureType}|${year}|${isIdf}|${isFromHuda}`;

const toTauxByTypeKey = (structureType: string): string => structureType;

/** Cibles financières par structure. */
export const buildCiblesFinancieresLookup = (
  inputs: CiblesFinancieresInputs
): CiblesFinancieresLookup => {
  const tarifByKey = new Map(
    inputs.tarifsJournaliersCibles.map((cible) => [
      toCibleKey(cible.structureType, cible.year, cible.isIdf),
      cible.tarifCible,
    ])
  );
  const tauxByType = new Map<string, number>(
    inputs.tauxEncadrementCibles.reduce((acc, cible) => {
      const key = toTauxByTypeKey(cible.structureType);
      if (!acc.has(key)) acc.set(key, cible.tauxCible);
      return acc;
    }, new Map<string, number>())
  );
  const tauxByKey = new Map(
    inputs.tauxEncadrementCibles.map((cible) => [
      toCibleKey(cible.structureType, cible.year, cible.isIdf, cible.isFromHuda),
      cible.tauxCible,
    ])
  );
  const isIdf = (structure: StatistiqueDbStructure): boolean =>
    inputs.idfDepartementNumeros.has(structure.departementAdministratif);

  return {
    getTarifJournalierCible: (structure, year) =>
      tarifByKey.get(toCibleKey(structure.type, year, isIdf(structure))) ?? null,
    getTauxEncadrementCible: (structure, year) =>
      (structure.type ? tauxByType.get(toTauxByTypeKey(structure.type)) : null) ??
      tauxByKey.get(toCibleKey(structure.type, year, isIdf(structure), inputs.cadaFromHudaStructureIds.has(structure.id))) ?? null,
    getTauxByType: (structureType: string | null) =>
      structureType ? tauxByType.get(toTauxByTypeKey(structureType)) ?? null : null,
  };
};
