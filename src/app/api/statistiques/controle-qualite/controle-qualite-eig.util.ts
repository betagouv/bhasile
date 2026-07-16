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
import { lookupStructureIdsForDnaAtDate } from "../statistiques.utils";

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
  // Un EIG est rattaché à une zone via son dnaCode : on ne compte que ceux qui
  // résolvent vers une structure active en scope à leur date. Sans ça, les
  // comptes seraient ceux de tout le périmètre chargé (cf. cartographie, où le
  // contexte est découpé par zone mais les EIG bruts, non).
  const structureIdsWithEig = new Set<number>();
  const eigsInScope: StatistiqueDbEig[] = [];

  for (const eig of eigsForPeriod) {
    if (!eig.dnaCode || !eig.evenementDate) {
      continue;
    }
    const structureIds = lookupStructureIdsForDnaAtDate(
      eig.dnaCode,
      new Date(eig.evenementDate),
      dnaLinks,
      structureVersionTimeline,
      activeStructureIds
    );
    if (structureIds.length === 0) {
      continue;
    }
    eigsInScope.push(eig);
    for (const structureId of structureIds) {
      structureIdsWithEig.add(structureId);
    }
  }

  const counts = sumEigCounts(eigsInScope);
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
