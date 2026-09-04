"use client";

import dayjs from "dayjs";
import { ReactElement, useMemo, useState } from "react";

import { ChartLegend } from "@/app/components/ChartLegend";
import BarChart from "@/app/components/common/BarChart";
import {
  TimePeriod,
  TimePeriodSelector,
} from "@/app/components/common/TimePeriodSelector";
import { getLastDisplayedPeriods } from "@/app/utils/statistiques-period.util";
import { useExportContext } from "@/contexts/ExportContext";
import { useStatistiquesContext } from "@/contexts/StatistiquesContext";

export const RMUChart = ({ startMonth, endMonth }: Props): ReactElement => {
  const { statistiques } = useStatistiquesContext();
  const isExporting = useExportContext();
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("byYear");

  const effectiveTimePeriod: TimePeriod = isExporting ? "byMonth" : timePeriod;

  const chartData = useMemo(() => {
    const rawRmuPeriodData = getLastDisplayedPeriods(
      statistiques.rmu?.[effectiveTimePeriod] || []
    );

    const sortedRmuPeriodData = rawRmuPeriodData.filter((periodStat) => {
      const date = dayjs(periodStat.date);
      const currentMonth = date.format("YYYY-MM");

      if (effectiveTimePeriod === "byYear") {
        const currentYear = date.year();
        const startYear = startMonth
          ? Number(startMonth.split("-")[0])
          : undefined;
        const endYear = endMonth ? Number(endMonth.split("-")[0]) : undefined;

        if (startYear !== undefined && currentYear < startYear) {
          return false;
        }
        if (endYear !== undefined && currentYear > endYear) {
          return false;
        }
        return true;
      }

      if (startMonth && currentMonth < startMonth) {
        return false;
      }
      if (endMonth && currentMonth > endMonth) {
        return false;
      }
      return true;
    });

    const labels = sortedRmuPeriodData.map((periodStat) => {
      const date = new Date(periodStat.date);

      if (effectiveTimePeriod === "byMonth") {
        return date
          .toLocaleDateString("fr-FR", {
            month: "short",
            year: "numeric",
          })
          .toLocaleUpperCase();
      }

      if (effectiveTimePeriod === "byTrimester") {
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
  }, [statistiques, effectiveTimePeriod, startMonth, endMonth]);

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
            timePeriod={effectiveTimePeriod}
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

type Props = {
  startMonth?: string;
  endMonth?: string;
};
