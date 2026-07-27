import { ReactElement, useMemo, useState } from "react";

import { StackedBarChart } from "@/app/components/common/StackedBarChart";
import {
  TimePeriod,
  TimePeriodSelector,
} from "@/app/components/common/TimePeriodSelector";
import { formatDate, getYearRange } from "@/app/utils/date.util";

import { useStatistiquesContext } from "../../_context/StatistiquesClientContext";

const MAX_DISPLAYED_TIME_PERIODS = 10;

export const EIGChart = (): ReactElement => {
  const { statistiques } = useStatistiquesContext();
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("byYear");

  const chartData = useMemo(() => {
    const eigPeriodData = statistiques.controleQualite[timePeriod] || [];

    const { years } = getYearRange();
    const filteredEigPeriodData = eigPeriodData.filter((periodStat) => {
      const itemYear = new Date(periodStat.date).getFullYear();
      return years.includes(itemYear);
    });

    const sortedEigPeriodData = [...filteredEigPeriodData]
      .sort(
        (firstEigPeriod, secondEigPeriod) =>
          new Date(firstEigPeriod.date).getTime() -
          new Date(secondEigPeriod.date).getTime()
      )
      .slice(-MAX_DISPLAYED_TIME_PERIODS);

    const labels = sortedEigPeriodData.map((periodStat) => {
      const date = new Date(periodStat.date);

      if (timePeriod === "byMonth") {
        return formatDate(date, {
          month: "short",
          year: "numeric",
        }).toLocaleUpperCase();
      }

      if (timePeriod === "byTrimester") {
        const quarter = Math.floor(date.getMonth() / 3) + 1;
        return `T${quarter} ${date.getFullYear()}`;
      }

      return date.getFullYear().toString();
    });

    const nbEigTotal = sortedEigPeriodData.map(
      (periodStat) => Number(periodStat.nbEig) || 0
    );
    const nbEigComportementViolent = sortedEigPeriodData.map(
      (periodStat) => Number(periodStat.nbEigComportementViolent) || 0
    );

    const nbEigSansComportementViolent = nbEigTotal.map(
      (total, index) => total - nbEigComportementViolent[index]
    );

    return {
      labels,
      series: [nbEigComportementViolent, nbEigSansComportementViolent],
    };
  }, [statistiques, timePeriod]);

  const colors = useMemo(() => ["#4F9D91", "#73E0CF"], []);

  return (
    <>
      <h4 className="text-title-blue-france text-lg">
        Événements indésirables graves
      </h4>
      <div className="grid grid-cols-3 gap-10">
        <div className="col-span-2">
          <StackedBarChart data={chartData} colors={colors} axisYLabel="EIG" />
        </div>
        <div>
          <TimePeriodSelector
            timePeriod={timePeriod}
            setTimePeriod={setTimePeriod}
          />
          <div className="flex items-center pb-6">
            <div className="h-3 w-3 bg-[#4F9D91] shrink-0" />
            <p className="pl-2 mb-0">
              Nombre d’EIG au motif de “comportement violent“
            </p>
          </div>
          <div className="flex items-center pb-6">
            <div className="h-3 w-3 bg-[#73E0CF] shrink-0" />
            <p className="pl-2 mb-0">
              Nombre d’EIG au motif autre que “comportement violent“
            </p>
          </div>
        </div>
      </div>
    </>
  );
};
