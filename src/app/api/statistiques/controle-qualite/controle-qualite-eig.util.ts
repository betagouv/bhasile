import { isEigComportementViolent } from "@/app/utils/eig.util";
import { ratio } from "@/app/utils/math.util";
import { roundStatsRate } from "@/app/utils/statistiques-format.util";
import type {
  EigCountTotalsStat,
  EigPeriodStat,
  EigRatesStat,
} from "@/schemas/api/statistique.schema";

import type {
  StatistiqueDbDnaLink,
  StatistiqueDbEig,
} from "../statistiques.db.type";
import { getTwelveMonthCutoffKey, toMonthKey } from "../statistiques.utils";

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

export const filterRecentEigs = (
  eigs: StatistiqueDbEig[]
): StatistiqueDbEig[] => {
  const cutoff = getTwelveMonthCutoffKey();
  return eigs.filter(
    (eig) =>
      eig.evenementDate && toMonthKey(new Date(eig.evenementDate)) >= cutoff
  );
};

const sumEigCounts = (eigs: StatistiqueDbEig[]): EigCountTotalsStat => {
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

const tauxEigComportementViolent = (counts: EigCountTotalsStat) =>
  roundStatsRate(ratio(counts.nbEigComportementViolent, counts.nbEig));

export const computeEigRates = (
  eigs: StatistiqueDbEig[],
  totalPlacesAutorisees: number
): EigRatesStat => {
  const counts = sumEigCounts(eigs);

  return {
    ...counts,
    tauxEig: roundStatsRate(
      totalPlacesAutorisees > 0 ? counts.nbEig / totalPlacesAutorisees : null
    ),
    tauxEigComportementViolent: tauxEigComportementViolent(counts),
  };
};

export const computeEigPeriodMetrics = (
  eigsForPeriod: StatistiqueDbEig[],
  activeStructureIds: Set<number>,
  totalStructures: number,
  dnaCodeToStructureIds: Map<string, Set<number>>
): EigPeriodStat => {
  const counts = sumEigCounts(eigsForPeriod);
  const structureIdsWithEig = new Set<number>();

  for (const eig of eigsForPeriod) {
    if (!eig.dnaCode) {
      continue;
    }
    const linkedStructureIds = dnaCodeToStructureIds.get(eig.dnaCode);
    if (!linkedStructureIds) {
      continue;
    }
    for (const structureId of linkedStructureIds) {
      if (activeStructureIds.has(structureId)) {
        structureIdsWithEig.add(structureId);
      }
    }
  }

  const nbStructuresSansDeclarationEig =
    totalStructures - structureIdsWithEig.size;

  return {
    nbStructuresSansDeclarationEig,
    partStructuresSansDeclarationEig: roundStatsRate(
      ratio(nbStructuresSansDeclarationEig, totalStructures)
    ),
    ...counts,
    tauxEigComportementViolent: tauxEigComportementViolent(counts),
  };
};
