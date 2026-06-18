import {
  isStructureEligibleForActiviteIndisponibilite,
  isStructureEligibleForActivitePresencesIndues,
} from "@/app/utils/structure.util";
import { ratio } from "@/app/utils/math.util";
import {
  ActiviteByMonthStat,
  StatistiqueApiRead,
} from "@/schemas/api/statistique.schema";

import { getMonthKey, monthKeyToDate } from "../shared/shared.utils";
import type {
  StatistiqueDbActivite,
  StatistiqueDbDnaLink,
  StatistiqueDbStructure,
} from "../statistiques.db.type";

type DnaEligibility = {
  indisponibilite: Set<string>;
  presencesIndues: Set<string>;
};

type MonthAccumulator = {
  placesEnregistreesDna: number;
  placesAutoriseesIndispo: number;
  placesIndisponibles: number;
  placesAutoriseesPresencesIndues: number;
  presencesInduesBPI: number;
  presencesInduesDeboutees: number;
};

const emptyMonthAccumulator = (): MonthAccumulator => ({
  placesEnregistreesDna: 0,
  placesAutoriseesIndispo: 0,
  placesIndisponibles: 0,
  placesAutoriseesPresencesIndues: 0,
  presencesInduesBPI: 0,
  presencesInduesDeboutees: 0,
});

const buildDnaEligibilityByActiviteScope = (
  dnaLinks: StatistiqueDbDnaLink[],
  structures: StatistiqueDbStructure[]
): DnaEligibility => {
  const structureTypeById = new Map(
    structures.map((structure) => [structure.id, structure.type])
  );
  const indisponibilite = new Set<string>();
  const presencesIndues = new Set<string>();

  for (const link of dnaLinks) {
    if (link.structureId === null) {
      continue;
    }
    const structureType = structureTypeById.get(link.structureId);
    if (!structureType) {
      continue;
    }
    if (isStructureEligibleForActiviteIndisponibilite(structureType)) {
      indisponibilite.add(link.dna.code);
    }
    if (isStructureEligibleForActivitePresencesIndues(structureType)) {
      presencesIndues.add(link.dna.code);
    }
  }

  return { indisponibilite, presencesIndues };
};

const toMonthStat = (
  monthKey: string,
  monthTotals: MonthAccumulator
): ActiviteByMonthStat => {
  const presencesInduesTotal =
    monthTotals.presencesInduesBPI + monthTotals.presencesInduesDeboutees;

  return {
    date: monthKeyToDate(monthKey),
    placesEnregistreesDna: monthTotals.placesEnregistreesDna,
    placesIndisponibles: monthTotals.placesIndisponibles,
    tauxIndisponibilite: ratio(
      monthTotals.placesIndisponibles,
      monthTotals.placesAutoriseesIndispo
    ),
    presencesInduesBPI: monthTotals.presencesInduesBPI,
    tauxPresencesInduesBPI: ratio(
      monthTotals.presencesInduesBPI,
      monthTotals.placesAutoriseesPresencesIndues
    ),
    presencesInduesDeboutees: monthTotals.presencesInduesDeboutees,
    tauxPresencesInduesDeboutees: ratio(
      monthTotals.presencesInduesDeboutees,
      monthTotals.placesAutoriseesPresencesIndues
    ),
    presencesInduesTotal,
    tauxPresencesInduesTotal: ratio(
      presencesInduesTotal,
      monthTotals.placesAutoriseesPresencesIndues
    ),
  };
};

export const computeActiviteStatistiques = (
  activites: StatistiqueDbActivite[],
  dnaLinks: StatistiqueDbDnaLink[],
  structures: StatistiqueDbStructure[]
): StatistiqueApiRead["activite"] => {
  const eligibility = buildDnaEligibilityByActiviteScope(dnaLinks, structures);
  const byMonth = new Map<string, MonthAccumulator>();

  for (const activite of activites) {
    if (!activite.dnaCode) {
      continue;
    }

    const monthKey = getMonthKey(new Date(activite.date));
    const monthTotals = byMonth.get(monthKey) ?? emptyMonthAccumulator();
    const placesAutorisees = activite.placesAutorisees ?? 0;

    monthTotals.placesEnregistreesDna += placesAutorisees;

    if (eligibility.indisponibilite.has(activite.dnaCode)) {
      monthTotals.placesAutoriseesIndispo += placesAutorisees;
      monthTotals.placesIndisponibles += activite.placesIndisponibles ?? 0;
    }

    if (eligibility.presencesIndues.has(activite.dnaCode)) {
      monthTotals.placesAutoriseesPresencesIndues += placesAutorisees;
      monthTotals.presencesInduesBPI += activite.presencesInduesBPI ?? 0;
      monthTotals.presencesInduesDeboutees +=
        activite.presencesInduesDeboutees ?? 0;
    }

    byMonth.set(monthKey, monthTotals);
  }

  return {
    byMonth: [...byMonth.entries()]
      .sort(([monthKeyA], [monthKeyB]) => monthKeyA.localeCompare(monthKeyB))
      .map(([monthKey, monthTotals]) => toMonthStat(monthKey, monthTotals)),
  };
};
