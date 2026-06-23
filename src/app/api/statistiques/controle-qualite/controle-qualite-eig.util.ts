import { isEigComportementViolent } from "@/app/utils/eig.util";
import { ratio } from "@/app/utils/math.util";
import { roundStatsRate } from "@/app/utils/statistiques-format.util";
import type {
  ControleQualitePeriodStat,
  EigStat,
} from "@/schemas/api/statistique.schema";

import { toMonthKey } from "../statistiques.utils";
import type {
  StatistiqueDbDnaLink,
  StatistiqueDbEig,
} from "../statistiques.db.type";

const getTwelveMonthCutoffKey = (): string => {
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
  return toMonthKey(twelveMonthsAgo);
};

export const buildDnaCodeToStructureIds = (
  dnaLinks: StatistiqueDbDnaLink[]
): Map<string, Set<number>> => {
  const dnaCodeToStructureIds = new Map<string, Set<number>>();

  for (const link of dnaLinks) {
    if (link.structureId === null) {
      continue;
    }
    const structureIds =
      dnaCodeToStructureIds.get(link.dna.code) ?? new Set<number>();
    structureIds.add(link.structureId);
    dnaCodeToStructureIds.set(link.dna.code, structureIds);
  }

  return dnaCodeToStructureIds;
};

const getStructureIdsFromEigs = (
  eigs: StatistiqueDbEig[],
  dnaCodeToStructureIds: Map<string, Set<number>>,
  activeStructureIds: Set<number>
): Set<number> => {
  const structureIds = new Set<number>();

  for (const eig of eigs) {
    if (!eig.dnaCode) {
      continue;
    }
    const linkedStructureIds = dnaCodeToStructureIds.get(eig.dnaCode);
    if (!linkedStructureIds) {
      continue;
    }
    for (const structureId of linkedStructureIds) {
      if (activeStructureIds.has(structureId)) {
        structureIds.add(structureId);
      }
    }
  }

  return structureIds;
};

export const countEigs = (
  eigs: StatistiqueDbEig[]
): { nbEig: number; nbEigComportementViolent: number } => {
  let nbEigComportementViolent = 0;

  for (const eig of eigs) {
    if (eig.type && isEigComportementViolent(eig.type)) {
      nbEigComportementViolent += 1;
    }
  }

  return {
    nbEig: eigs.length,
    nbEigComportementViolent,
  };
};

export const filterRecentEigs = (
  eigs: StatistiqueDbEig[]
): StatistiqueDbEig[] => {
  const cutoff = getTwelveMonthCutoffKey();
  return eigs.filter(
    (eig) =>
      eig.evenementDate && toMonthKey(new Date(eig.evenementDate)) >= cutoff
  );
};

export type EigRatesStat = Pick<
  EigStat,
  | "tauxEig"
  | "nbEig"
  | "nbEigComportementViolent"
  | "tauxEigComportementViolent"
>;

export const computeEigRates = (
  eigs: StatistiqueDbEig[],
  totalPlacesAutorisees: number
): EigRatesStat => {
  const { nbEig, nbEigComportementViolent } = countEigs(eigs);

  return {
    tauxEig: roundStatsRate(
      totalPlacesAutorisees > 0 ? nbEig / totalPlacesAutorisees : null
    ),
    nbEig,
    nbEigComportementViolent,
    tauxEigComportementViolent: roundStatsRate(
      ratio(nbEigComportementViolent, nbEig)
    ),
  };
};

export type EigPeriodMetrics = Pick<
  ControleQualitePeriodStat,
  | "nbStructuresSansDeclarationEig"
  | "partStructuresSansDeclarationEig"
  | "nbEig"
  | "nbEigComportementViolent"
  | "tauxEigComportementViolent"
>;

export const computeEigPeriodMetrics = (
  eigsForPeriod: StatistiqueDbEig[],
  activeStructureIdSet: Set<number>,
  totalStructures: number,
  dnaCodeToStructureIds: Map<string, Set<number>>
): EigPeriodMetrics => {
  const { nbEig, nbEigComportementViolent } = countEigs(eigsForPeriod);
  const structureIdsWithEig = getStructureIdsFromEigs(
    eigsForPeriod,
    dnaCodeToStructureIds,
    activeStructureIdSet
  );
  const nbStructuresSansDeclarationEig =
    totalStructures - structureIdsWithEig.size;

  return {
    nbStructuresSansDeclarationEig,
    partStructuresSansDeclarationEig: roundStatsRate(
      ratio(nbStructuresSansDeclarationEig, totalStructures)
    ),
    nbEig,
    nbEigComportementViolent,
    tauxEigComportementViolent: roundStatsRate(
      ratio(nbEigComportementViolent, nbEig)
    ),
  };
};
