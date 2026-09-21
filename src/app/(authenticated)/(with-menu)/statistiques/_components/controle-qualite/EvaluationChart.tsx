"use client";

import { ReactElement, useMemo, useState } from "react";

import { ChartLegend } from "@/app/components/ChartLegend";
import { DoubleYAxisBarLineChart } from "@/app/components/common/DoubleYAxisBarLineChart";
import {
  TimePeriod,
  TimePeriodSelector,
} from "@/app/components/common/TimePeriodSelector";
import { getLastDisplayedPeriods } from "@/app/utils/statistiques-period.util";
import { EVALUATION_START_YEAR } from "@/constants";
import { useStatistiquesContext } from "@/contexts/StatistiquesContext";

export const EvaluationChart = ({
  startYear,
  endYear,
}: Props): ReactElement => {
  const { statistiques } = useStatistiquesContext();
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("byYear");

  const startMonth = `${startYear?.toString()}-01`;
  const endMonth = `${endYear?.toString()}-01`;

  const chartData = useMemo(() => {
    const rawEvaluationPeriodData =
      startYear && endYear
        ? getLastDisplayedPeriods(
            statistiques.controleQualite?.[timePeriod] || [],
            EVALUATION_START_YEAR,
            startMonth,
            endMonth,
            timePeriod
          )
        : getLastDisplayedPeriods(
            statistiques.controleQualite?.[timePeriod] || [],
            EVALUATION_START_YEAR
          );

    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    const filteredEvaluationPeriodData = rawEvaluationPeriodData.filter(
      (periodItem) => {
        if (timePeriod === "byMonth") {
          const periodDate = new Date(periodItem.date);
          const periodYear = periodDate.getFullYear();
          const periodMonth = periodDate.getMonth();

          if (
            periodYear > currentYear ||
            (periodYear === currentYear && periodMonth > currentMonth)
          ) {
            return false;
          }
        }
        return true;
      }
    );

    const labels = filteredEvaluationPeriodData.map((periodItem) => {
      const date = new Date(periodItem.date);

      if (timePeriod === "byMonth") {
        return date
          .toLocaleDateString("fr-FR", {
            month: "short",
            year: "numeric",
          })
          .toLocaleUpperCase();
      }

      if (timePeriod === "byTrimester") {
        const quarter = Math.floor(date.getMonth() / 3) + 1;
        return `T${quarter} ${date.getFullYear()}`;
      }

      return date.getFullYear().toString();
    });

    const nbStructuresEvaluees = filteredEvaluationPeriodData.map(
      (periodItem) => Number(periodItem.nbStructuresEvaluees) || 0
    );

    const moyenneGenerale = filteredEvaluationPeriodData.map((periodItem) =>
      periodItem.noteGenerale === null ? null : Number(periodItem.noteGenerale)
    );

    return {
      labels,
      barsSeries: [moyenneGenerale],
      lineSeries: nbStructuresEvaluees,
    };
  }, [
    startYear,
    endYear,
    statistiques.controleQualite,
    timePeriod,
    startMonth,
    endMonth,
  ]);

  const colors = useMemo(
    () => ({
      bars: ["#FA7659"],
      line: "var(--blue-france-sun-113-625)",
    }),
    []
  );

  return (
    <div className="break-inside-avoid">
      <h4 className="text-title-blue-france text-lg" id="structure-stats-table">
        Évaluations
      </h4>
      <div className="grid grid-cols-3 gap-10">
        <div className="col-span-2">
          <DoubleYAxisBarLineChart
            data={chartData}
            colors={colors}
            leftAxisLabel="Note"
            rightAxisLabel="Nb structures"
          />
        </div>
        <div>
          <TimePeriodSelector
            timePeriod={timePeriod}
            setTimePeriod={setTimePeriod}
          />
          <ChartLegend
            label="Moyenne générale de la note totale"
            color="#FA7659"
          />
          <ChartLegend
            label="Nombre de structures évaluées"
            color="var(--border-action-high-blue-france)"
            type="line"
          />
        </div>
      </div>
      <span className="italic">
        Seules les structures autorisées (CADA et CPH) sont concernées par les
        évaluations. Seuls les EIG déclarés via démarches numériques sont
        affichés.
      </span>
    </div>
  );
};

type Props = {
  startYear?: number;
  endYear?: number;
};
