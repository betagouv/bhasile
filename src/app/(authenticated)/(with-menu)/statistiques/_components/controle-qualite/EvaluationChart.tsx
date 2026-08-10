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

export const EvaluationChart = (): ReactElement => {
  const { statistiques } = useStatistiquesContext();
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("byYear");

  const chartData = useMemo(() => {
    const sortedEvaluationPeriodData = getLastDisplayedPeriods(
      statistiques.controleQualite[timePeriod] || [],
      EVALUATION_START_YEAR
    );

    const labels = sortedEvaluationPeriodData.map((item) => {
      const date = new Date(item.date);

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
    </>
  );
};
