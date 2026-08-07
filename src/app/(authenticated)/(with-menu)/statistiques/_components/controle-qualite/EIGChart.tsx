import { ReactElement, useMemo, useState } from "react";

import { StackedBarChart } from "@/app/components/common/StackedBarChart";
import {
  TimePeriod,
  TimePeriodSelector,
} from "@/app/components/common/TimePeriodSelector";
import { formatDate } from "@/app/utils/date.util";
import { getLastDisplayedPeriods } from "@/app/utils/statistiques-period.util";
import { EIG_START_YEAR } from "@/constants";
import { useStatistiquesContext } from "@/contexts/StatistiquesContext";

export const EIGChart = (): ReactElement => {
  const { statistiques } = useStatistiquesContext();
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("byYear");

  const chartData = useMemo(() => {
    const sortedEigPeriodData = getLastDisplayedPeriods(
      statistiques.controleQualite[timePeriod] || [],
      EIG_START_YEAR
    );

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
          <StackedBarChart
            data={chartData}
            colors={colors}
            axisYLabel="Nb EIG"
          />
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
