"use client";

import { ReactElement, useMemo, useState } from "react";

import BarChart from "@/app/components/common/BarChart";
import {
  TimePeriod,
  TimePeriodSelector,
} from "@/app/components/common/TimePeriodSelector";
import { formatDate, getYearRange } from "@/app/utils/date.util";

import { useStatistiquesContext } from "../../_context/StatistiquesClientContext";

const MAX_DISPLAYED_TIME_PERIODS = 10;

export const RMUChart = (): ReactElement => {
  const { statistiques } = useStatistiquesContext();
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("byYear");

  const chartData = useMemo(() => {
    const rmuPeriodData = statistiques.rmu?.[timePeriod] || [];

    const { years } = getYearRange();
    const filteredRmuPeriodData = rmuPeriodData.filter((periodStat) => {
      const itemYear = new Date(periodStat.date).getFullYear();
      return years.includes(itemYear);
    });

    const sortedRmuPeriodData = [...filteredRmuPeriodData]
      .sort(
        (firstRmuPeriod, secondRmuPeriod) =>
          new Date(firstRmuPeriod.date).getTime() -
          new Date(secondRmuPeriod.date).getTime()
      )
      .slice(-MAX_DISPLAYED_TIME_PERIODS);

    const labels = sortedRmuPeriodData.map((periodStat) => {
      const date = new Date(periodStat.date);

      if (timePeriod === "byMonth") {
        return formatDate(date, {
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
      axisY: {
        offset: 70,
        labelInterpolationFnc: (value: number) => value.toLocaleString(),
      },
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
          <BarChart data={chartData} options={options} colors={colors} />
        </div>
        <div>
          <TimePeriodSelector
            timePeriod={timePeriod}
            setTimePeriod={setTimePeriod}
          />
          <div className="flex items-center pb-6">
            <div className="h-3 w-3 bg-[#BD987A] shrink-0" />
            <p className="pl-2 mb-0">Référés mesures utiles engagés</p>
          </div>
          <div className="flex items-center pb-6">
            <div className="h-3 w-3 bg-[#EAC7AD] shrink-0" />
            <p className="pl-2 mb-0">Référés mesures utiles exécutés</p>
          </div>
        </div>
      </div>
    </>
  );
};
