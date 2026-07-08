import { ratio } from "@/app/utils/math.util";
import { roundStatsRate } from "@/app/utils/statistiques-format.util";
import {
  RmuPeriodStat,
  StatistiqueApiRead,
} from "@/schemas/api/statistique.schema";

import type {
  StatistiqueDbRmu,
  StatistiquesContext,
} from "../statistiques.db.type";
import {
  groupByPeriodKey,
  monthKeyToDate,
  toMonthKey,
  toTrimesterKey,
  toYearKey,
  trimesterKeyToDate,
  yearKeyToDate,
} from "../statistiques.utils";

type RmuTotals = {
  referesEngages: number;
  referesExecutes: number;
};

const emptyRmuTotals = (): RmuTotals => ({
  referesEngages: 0,
  referesExecutes: 0,
});

const accumulateRmu = (totals: RmuTotals, rmu: StatistiqueDbRmu): void => {
  totals.referesEngages += rmu.referesEngages ?? 0;
  totals.referesExecutes += rmu.referesExecutes ?? 0;
};

const toRmuPeriodStat = (date: Date, totals: RmuTotals): RmuPeriodStat => ({
  date,
  referesEngages: totals.referesEngages,
  referesExecutes: totals.referesExecutes,
  tauxExecute: roundStatsRate(
    ratio(totals.referesExecutes, totals.referesEngages)
  ),
});

type PeriodSeriesConfig = {
  toPeriodKey: (date: Date) => string;
  toDate: (periodKey: string) => Date;
};

const computeRmuPeriodSeries = (
  rmus: StatistiqueDbRmu[],
  config: PeriodSeriesConfig
): RmuPeriodStat[] => {
  const rmusByPeriod = groupByPeriodKey(
    rmus,
    (rmu) => rmu.date,
    config.toPeriodKey
  );

  return [...rmusByPeriod.entries()]
    .sort(([periodKeyA], [periodKeyB]) => periodKeyA.localeCompare(periodKeyB))
    .map(([periodKey, rmusForPeriod]) => {
      const totals = emptyRmuTotals();
      for (const rmu of rmusForPeriod) {
        accumulateRmu(totals, rmu);
      }
      return toRmuPeriodStat(config.toDate(periodKey), totals);
    });
};

export const computeRmuStatistiques = (
  context: StatistiquesContext
): StatistiqueApiRead["rmu"] => {
  const { rmus } = context;
  if (rmus === null) {
    return null;
  }

  return {
    byMonth: computeRmuPeriodSeries(rmus, {
      toPeriodKey: toMonthKey,
      toDate: monthKeyToDate,
    }),
    byTrimester: computeRmuPeriodSeries(rmus, {
      toPeriodKey: toTrimesterKey,
      toDate: trimesterKeyToDate,
    }),
    byYear: computeRmuPeriodSeries(rmus, {
      toPeriodKey: toYearKey,
      toDate: yearKeyToDate,
    }),
  };
};
