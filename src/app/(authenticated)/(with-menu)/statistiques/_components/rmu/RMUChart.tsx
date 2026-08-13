"use client";

import { ReactElement, useMemo, useState } from "react";

import { ChartLegend } from "@/app/components/ChartLegend";
import BarChart from "@/app/components/common/BarChart";
import {
  TimePeriod,
  TimePeriodSelector,
} from "@/app/components/common/TimePeriodSelector";
import { getLastDisplayedPeriods } from "@/app/utils/statistiques-period.util";
import { useStatistiquesContext } from "@/contexts/StatistiquesContext";

export const RMUChart = (): ReactElement => {
  const { statistiques } = useStatistiquesContext();
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("byYear");

  const chartData = useMemo(() => {
    const sortedRmuPeriodData = getLastDisplayedPeriods(
      statistiques.rmu?.[timePeriod] || []
    );

    const labels = sortedRmuPeriodData.map((periodStat) => {
      const date = new Date(periodStat.date);

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

    const referesEngagesTotal = sortedRmuPeriodData.map(
      (periodStat) => Number(periodStat.referesEngages) || 0
    );
    const referesExecutesTotal = sortedRmuPeriodData.map(
      (periodStat) => Number(periodStat.referesExecutes) || 0
    );

    return {
      labels,
      series: [referesEngagesTotal, referesExecutesTotal],
    };
  }, [statistiques, timePeriod]);

  const colors = useMemo(() => ["#BD987A", "#EAC7AD"], []);
  const options = useMemo(
    () => ({
      seriesBarDistance: 10,
      axisY: { offset: 50 },
      axisX: { showGrid: false },
    }),
    []
  );

  return (
    <>
      <h4 className="text-title-blue-france text-lg">
        RMU engagés et exécutés
      </h4>
      <div className="grid grid-cols-3 gap-10">
        <div className="col-span-2">
          <BarChart
            data={chartData}
            options={options}
            colors={colors}
            axisYLabel="Nb RMU"
          />
        </div>
        <div>
          <TimePeriodSelector
            timePeriod={timePeriod}
            setTimePeriod={setTimePeriod}
          />
          <ChartLegend
            label="Référés mesures utiles engagés"
            color="var(--brown-opera-main-680)"
          />
          <ChartLegend
            label="Référés mesures utiles exécutés"
            color="var(--brown-opera-850-200)"
          />
        </div>
      </div>
    </>
  );
};
