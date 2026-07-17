import { ReactElement, useMemo, useState } from "react";

import { StackedBarLineChart } from "@/app/components/common/StackedBarLineChart";
import {
  TimePeriod,
  TimePeriodSelector,
} from "@/app/components/common/TimePeriodSelector";
import { getYearRange } from "@/app/utils/date.util";

import { useStatistiquesContext } from "../../_context/StatistiquesClientContext";

const MAX_DISPLAYED_TIME_PERIODS = 10;

export const EvaluationChart = (): ReactElement => {
  const { statistiques } = useStatistiquesContext();
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("byYear");

  const chartData = useMemo(() => {
    const evaluationPeriodData = statistiques.controleQualite[timePeriod] || [];

    const { years } = getYearRange();
    const filteredEvaluationPeriodData = evaluationPeriodData.filter(
      (periodStat) => {
        const itemYear = new Date(periodStat.date).getFullYear();
        return years.includes(itemYear);
      }
    );

    const sortedEvaluationPeriodData = [...filteredEvaluationPeriodData]
      .sort(
        (firstEvaluationPeriod, secondEvaluationPeriod) =>
          new Date(firstEvaluationPeriod.date).getTime() -
          new Date(secondEvaluationPeriod.date).getTime()
      )
      .slice(-MAX_DISPLAYED_TIME_PERIODS);

    const labels = sortedEvaluationPeriodData.map((item) => {
      const date = new Date(item.date);

      if (timePeriod === "byMonth") {
        return date.toLocaleDateString("fr-FR", {
          month: "short",
          year: "numeric",
        });
      }

      if (timePeriod === "byTrimester") {
        const quarter = Math.floor(date.getMonth() / 3) + 1;
        return `T${quarter} ${date.getFullYear()}`;
      }

      return date.getFullYear().toString();
    });

    const nbStructuresEvaluees = sortedEvaluationPeriodData.map(
      (item) => Number(item.nbStructuresEvaluees) || 0
    );

    const moyenneGenerale = sortedEvaluationPeriodData.map(
      (item) => Number(item.noteGenerale) || 0
    );

    return {
      labels,
      barsSeries: [moyenneGenerale],
      lineSeries: nbStructuresEvaluees,
    };
  }, [statistiques, timePeriod]);

  const colors = useMemo(
    () => ({
      bars: ["#FA7659"],
      line: "var(--blue-france-sun-113-625)",
    }),
    []
  );

  return (
    <>
      <h4 className="text-title-blue-france text-lg" id="structure-stats-table">
        Évaluations
      </h4>
      <div className="grid grid-cols-3 gap-10">
        <div className="col-span-2">
          <StackedBarLineChart data={chartData} colors={colors} />
        </div>
        <div>
          <TimePeriodSelector
            timePeriod={timePeriod}
            setTimePeriod={setTimePeriod}
          />
          <div className="flex items-center pb-6">
            <div className="h-3 w-3 bg-[#FA7659] shrink-0" />
            <p className="pl-2 mb-0">Moyenne générale de la note totale</p>
          </div>
          <div className="pb-2 flex items-center">
            <div className="w-[40px] border-b-2 border-b-action-high-blue-france mr-2 shrink-0 grow-0" />
            Nombre de structures évaluées
          </div>
        </div>
      </div>
      <span className="italic">
        Pour rappel, seules les structures autorisées (CADA et CPH) sont
        concernées par les évaluations.
      </span>
    </>
  );
};
