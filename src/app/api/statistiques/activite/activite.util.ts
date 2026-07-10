import { ratio } from "@/app/utils/math.util";
import { roundStatsRate } from "@/app/utils/statistiques-format.util";
import {
  isStructureEligibleForActiviteIndisponibilite,
  isStructureEligibleForActivitePresencesIndues,
} from "@/app/utils/structure.util";
import {
  ActiviteByMonthStat,
  ActiviteSummaryStat,
  StatistiqueApiRead,
} from "@/schemas/api/statistique.schema";

import type {
  StatistiqueDbActivite,
  StatistiqueDbStructure,
  StatistiquesContext,
} from "../statistiques.db.type";
import {
  lookupActiveStructureIds,
  lookupStructureIdsForDnaAtDate,
  monthKeyToDate,
  toMonthKey,
} from "../statistiques.utils";

type ActiviteTotals = {
  placesEnregistreesDna: number;
  placesAutoriseesHorsCaes: number;
  placesIndisponibles: number;
  placesAutoriseesHorsCaesEtCph: number;
  presencesInduesBPI: number;
  presencesInduesDeboutees: number;
  desinsectisation: number;
  remiseEnEtat: number;
  sousOccupation: number;
  travaux: number;
};

const emptyActiviteTotals = (): ActiviteTotals => ({
  placesEnregistreesDna: 0,
  placesAutoriseesHorsCaes: 0,
  placesIndisponibles: 0,
  placesAutoriseesHorsCaesEtCph: 0,
  presencesInduesBPI: 0,
  presencesInduesDeboutees: 0,
  desinsectisation: 0,
  remiseEnEtat: 0,
  sousOccupation: 0,
  travaux: 0,
});

const toActiviteSummary = (totals: ActiviteTotals): ActiviteSummaryStat => {
  const presencesInduesTotal =
    totals.presencesInduesBPI + totals.presencesInduesDeboutees;

  return {
    placesEnregistreesDna: totals.placesEnregistreesDna,
    placesIndisponibles: totals.placesIndisponibles,
    placesDisponibles:
      totals.placesAutoriseesHorsCaes - totals.placesIndisponibles,
    tauxIndisponibilite: roundStatsRate(
      ratio(totals.placesIndisponibles, totals.placesAutoriseesHorsCaes)
    ),
    motifsIndisponibilite: {
      desinsectisation: totals.desinsectisation,
      remiseEnEtat: totals.remiseEnEtat,
      sousOccupation: totals.sousOccupation,
      travaux: totals.travaux,
    },
    presencesInduesBPI: totals.presencesInduesBPI,
    tauxPresencesInduesBPI: roundStatsRate(
      ratio(totals.presencesInduesBPI, totals.placesAutoriseesHorsCaesEtCph)
    ),
    presencesInduesDeboutees: totals.presencesInduesDeboutees,
    tauxPresencesInduesDeboutees: roundStatsRate(
      ratio(
        totals.presencesInduesDeboutees,
        totals.placesAutoriseesHorsCaesEtCph
      )
    ),
    presencesInduesTotal,
    tauxPresencesInduesTotal: roundStatsRate(
      ratio(presencesInduesTotal, totals.placesAutoriseesHorsCaesEtCph)
    ),
  };
};

const toActiviteByMonthStat = (
  monthKey: string,
  totals: ActiviteTotals
): ActiviteByMonthStat => {
  const summary = toActiviteSummary(totals);

  return {
    date: monthKeyToDate(monthKey),
    placesEnregistreesDna: summary.placesEnregistreesDna,
    placesIndisponibles: summary.placesIndisponibles,
    tauxIndisponibilite: summary.tauxIndisponibilite,
    presencesInduesBPI: summary.presencesInduesBPI,
    tauxPresencesInduesBPI: summary.tauxPresencesInduesBPI,
    presencesInduesDeboutees: summary.presencesInduesDeboutees,
    tauxPresencesInduesDeboutees: summary.tauxPresencesInduesDeboutees,
    presencesInduesTotal: summary.presencesInduesTotal,
    tauxPresencesInduesTotal: summary.tauxPresencesInduesTotal,
  };
};

const resolveActiviteStructureIds = (
  activite: StatistiqueDbActivite,
  dnaLinks: StatistiquesContext["dnaLinks"],
  structureVersionTimeline: StatistiquesContext["structureVersionTimeline"],
  structureIdsInScope: Set<number>
): number[] => {
  if (!activite.dnaCode || !activite.date) {
    return [];
  }

  return lookupStructureIdsForDnaAtDate(
    activite.dnaCode,
    new Date(activite.date),
    dnaLinks,
    structureVersionTimeline,
    structureIdsInScope
  );
};

const accumulateActivite = (
  totals: ActiviteTotals,
  activite: StatistiqueDbActivite,
  structureIds: number[],
  structureTypeById: Map<number, StatistiqueDbStructure["type"]>
): void => {
  const placesAutorisees = activite.placesAutorisees ?? 0;

  totals.placesEnregistreesDna += placesAutorisees;

  // Exclusion CAES
  if (
    structureIds.some((structureId) =>
      isStructureEligibleForActiviteIndisponibilite(
        structureTypeById.get(structureId)
      )
    )
  ) {
    totals.placesAutoriseesHorsCaes += placesAutorisees;
    totals.placesIndisponibles += activite.placesIndisponibles ?? 0;
    totals.desinsectisation += activite.desinsectisation ?? 0;
    totals.remiseEnEtat += activite.remiseEnEtat ?? 0;
    totals.sousOccupation += activite.sousOccupation ?? 0;
    totals.travaux += activite.travaux ?? 0;
  }

  if (
    structureIds.some((structureId) =>
      isStructureEligibleForActivitePresencesIndues(
        structureTypeById.get(structureId)
      )
    )
  ) {
    totals.placesAutoriseesHorsCaesEtCph += placesAutorisees;
    totals.presencesInduesBPI += activite.presencesInduesBPI ?? 0;
    totals.presencesInduesDeboutees += activite.presencesInduesDeboutees ?? 0;
  }
};

const buildLatestActiviteByStructureId = (
  activites: StatistiqueDbActivite[],
  dnaLinks: StatistiquesContext["dnaLinks"],
  structureVersionTimeline: StatistiquesContext["structureVersionTimeline"],
  structureIdsInScope: Set<number>
): Map<number, StatistiqueDbActivite> => {
  const latestByStructureId = new Map<number, StatistiqueDbActivite>();

  for (const activite of [...activites].sort(
    (activiteA, activiteB) =>
      new Date(activiteB.date).getTime() - new Date(activiteA.date).getTime()
  )) {
    for (const structureId of resolveActiviteStructureIds(
      activite,
      dnaLinks,
      structureVersionTimeline,
      structureIdsInScope
    )) {
      if (!latestByStructureId.has(structureId)) {
        latestByStructureId.set(structureId, activite);
      }
    }
  }

  return latestByStructureId;
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
    activeStructureIdsByPeriod,
  } = context;
  const structureTypeById = new Map(
    allStructures.map((structure) => [structure.id, structure.type])
  );
  const structureIdsNow = new Set(structures.map((structure) => structure.id));

  const summaryTotals = emptyActiviteTotals();
  const latestActiviteByStructureId = buildLatestActiviteByStructureId(
    activites,
    dnaLinks,
    structureVersionTimeline,
    structureIdsNow
  );

  for (const [structureId, activite] of latestActiviteByStructureId) {
    accumulateActivite(
      summaryTotals,
      activite,
      [structureId],
      structureTypeById
    );
  }

  const byMonth = new Map<string, ActiviteTotals>();

  for (const activite of activites) {
    const monthKey = toMonthKey(new Date(activite.date));
    const activeStructureIdsForMonth = lookupActiveStructureIds(
      activeStructureIdsByPeriod,
      "month",
      monthKey
    );
    const structureIds = resolveActiviteStructureIds(
      activite,
      dnaLinks,
      structureVersionTimeline,
      activeStructureIdsForMonth
    );
    if (structureIds.length === 0) {
      continue;
    }

    const monthTotals = byMonth.get(monthKey) ?? emptyActiviteTotals();
    accumulateActivite(monthTotals, activite, structureIds, structureTypeById);
    byMonth.set(monthKey, monthTotals);
  }

  return {
    summary: toActiviteSummary(summaryTotals),
    byMonth: [...byMonth.entries()]
      .sort(([monthKeyA], [monthKeyB]) => monthKeyA.localeCompare(monthKeyB))
      .map(([monthKey, monthTotals]) =>
        toActiviteByMonthStat(monthKey, monthTotals)
      ),
  };
};
