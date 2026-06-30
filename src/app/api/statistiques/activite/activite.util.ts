import { ratio } from "@/app/utils/math.util";
import { roundStatsRate } from "@/app/utils/statistiques-format.util";
import {
  isStructureEligibleForActiviteIndisponibilite,
  isStructureEligibleForActivitePresencesIndues,
} from "@/app/utils/structure.util";
import {
  ActiviteByMonthStat,
  StatistiqueApiRead,
} from "@/schemas/api/statistique.schema";

import type {
  StatistiquesContext,
} from "../statistiques.db.type";
import {
  lookupStructureIdsForDnaAtDate,
  monthKeyToDate,
  toMonthKey,
} from "../statistiques.utils";

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
    tauxIndisponibilite: roundStatsRate(
      ratio(
        monthTotals.placesIndisponibles,
        monthTotals.placesAutoriseesIndispo
      )
    ),
    presencesInduesBPI: monthTotals.presencesInduesBPI,
    tauxPresencesInduesBPI: roundStatsRate(
      ratio(
        monthTotals.presencesInduesBPI,
        monthTotals.placesAutoriseesPresencesIndues
      )
    ),
    presencesInduesDeboutees: monthTotals.presencesInduesDeboutees,
    tauxPresencesInduesDeboutees: roundStatsRate(
      ratio(
        monthTotals.presencesInduesDeboutees,
        monthTotals.placesAutoriseesPresencesIndues
      )
    ),
    presencesInduesTotal,
    tauxPresencesInduesTotal: roundStatsRate(
      ratio(presencesInduesTotal, monthTotals.placesAutoriseesPresencesIndues)
    ),
  };
};

export const computeActiviteStatistiques = (
  context: StatistiquesContext
): StatistiqueApiRead["activite"] => {
  const {
    activites,
    dnaLinks,
    structureVersionTimeline,
    allStructures,
    structures,
  } = context;
  const structureTypeById = new Map(
    allStructures.map((structure) => [structure.id, structure.type])
  );
  const structureIdsInScope = new Set(structures.map((structure) => structure.id));
  const byMonth = new Map<string, MonthAccumulator>();

  for (const activite of activites) {
    if (!activite.dnaCode || !activite.date) {
      continue;
    }

    const structureIds = lookupStructureIdsForDnaAtDate(
      activite.dnaCode,
      new Date(activite.date),
      dnaLinks,
      structureVersionTimeline,
      structureIdsInScope
    );
    if (structureIds.length === 0) {
      continue;
    }

    const monthKey = toMonthKey(new Date(activite.date));
    const monthTotals = byMonth.get(monthKey) ?? emptyMonthAccumulator();
    const placesAutorisees = activite.placesAutorisees ?? 0;

    monthTotals.placesEnregistreesDna += placesAutorisees;

    let inIndisponibiliteScope = false;
    let inPresencesInduesScope = false;
    for (const structureId of structureIds) {
      const structureType = structureTypeById.get(structureId);
      if (!structureType) {
        continue;
      }
      if (isStructureEligibleForActiviteIndisponibilite(structureType)) {
        inIndisponibiliteScope = true;
      }
      if (isStructureEligibleForActivitePresencesIndues(structureType)) {
        inPresencesInduesScope = true;
      }
    }

    if (inIndisponibiliteScope) {
      monthTotals.placesAutoriseesIndispo += placesAutorisees;
      monthTotals.placesIndisponibles += activite.placesIndisponibles ?? 0;
    }

    if (inPresencesInduesScope) {
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
