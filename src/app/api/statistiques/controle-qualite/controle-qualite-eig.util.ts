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
  StatistiqueDbStructureVersionTimeline,
} from "../statistiques.db.type";
import {
  getTwelveMonthCutoffKey,
  lookupStructureIdsForDnaAtDate,
  toMonthKey,
} from "../statistiques.utils";

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
  dnaLinks: StatistiqueDbDnaLink[],
  structureVersionTimeline: StatistiqueDbStructureVersionTimeline[]
): EigPeriodStat => {
  const counts = sumEigCounts(eigsForPeriod);
  const structureIdsWithEig = new Set<number>();

  for (const eig of eigsForPeriod) {
    if (!eig.dnaCode || !eig.evenementDate) {
      continue;
    }
    for (const structureId of lookupStructureIdsForDnaAtDate(
      eig.dnaCode,
      new Date(eig.evenementDate),
      dnaLinks,
      structureVersionTimeline,
      activeStructureIds
    )) {
      structureIdsWithEig.add(structureId);
    }
  }

  const totalStructures = activeStructureIds.size;
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
