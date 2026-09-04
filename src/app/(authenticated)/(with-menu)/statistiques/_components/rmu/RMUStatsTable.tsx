"use client";

import dayjs from "dayjs";
import { ReactElement, useState } from "react";

import { Table } from "@/app/components/common/Table";
import {
  TimePeriod,
  TimePeriodSelector,
} from "@/app/components/common/TimePeriodSelector";
import { formatDate } from "@/app/utils/date.util";
import { formatPercentage } from "@/app/utils/number.util";
import { filterDisplayedPeriods } from "@/app/utils/statistiques-period.util";
import { useExportContext } from "@/contexts/ExportContext";
import { useStatistiquesContext } from "@/contexts/StatistiquesContext";
import { RmuPeriodStat } from "@/schemas/api/statistique.schema";

const rmuLines: RMULine[] = [
  {
    label: "Référés mesures utiles engagés",
    key: "referesEngages",
  },
  {
    label: "Référés mesures utiles exécutés",
    key: "referesExecutes",
  },
  {
    label: "Taux de RMU exécuté",
    key: "tauxExecute",
    format: (value) => formatPercentage(Number(value)),
  },
];

export const RMUStatsTable = ({
  startMonth,
  endMonth,
}: Props): ReactElement => {
  const { statistiques } = useStatistiquesContext();
  const isExporting = useExportContext();
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("byYear");

  const effectiveTimePeriod: TimePeriod = isExporting ? "byMonth" : timePeriod;

  const RMUPeriods = filterDisplayedPeriods(
    statistiques?.rmu?.[effectiveTimePeriod] ?? []
  ).filter((periodItem) => {
    const date = dayjs(periodItem.date);
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

  const renderPeriodHeader = (period: RmuPeriodStat) => {
    const periodDate = new Date(period.date);
    if (effectiveTimePeriod === "byMonth") {
      return formatDate(periodDate, {
        month: "short",
        year: "numeric",
      });
    }
    if (effectiveTimePeriod === "byTrimester") {
      const trimester = Math.floor(periodDate.getMonth() / 3) + 1;
      return `T${trimester} ${periodDate.getFullYear()}`;
    }
    return periodDate.getFullYear();
  };

  const getHeadings = (periods: RmuPeriodStat[]) => {
    return [
      <th scope="col" key="heading-label">
        {" "}
      </th>,
      ...periods.map((period, index) => (
        <th
          scope="col"
          key={`${period.date}-${index}`}
          className="text-center font-bold"
        >
          {renderPeriodHeader(period)}
        </th>
      )),
    ];
  };

  const rmuStats = rmuLines.map((line) => ({
    label: line.label,
    value: RMUPeriods.map((periodItem) => {
      const rawValue = periodItem
        ? periodItem[line.key as keyof RmuPeriodStat]
        : null;

      return line.format && rawValue !== null && rawValue !== undefined
        ? line.format(rawValue, periodItem)
        : rawValue;
    }),
  }));

  return (
    <div>
      <div className="flex">
        <h4
          className="text-title-blue-france text-lg pr-4"
          id="rmu-stats-table"
        >
          Tableau de données
        </h4>
        <TimePeriodSelector
          timePeriod={effectiveTimePeriod}
          setTimePeriod={setTimePeriod}
        />
      </div>
      <Table
        headings={getHeadings(RMUPeriods)}
        ariaLabelledBy="rmu-stats-table"
        className="text-mention-grey [&_thead_tr]:bg-transparent! [&_thead_tr]:h-12! w-full"
        enableBorders
        stickFirstColumn
        firstColumnWidth="18rem"
        defaultScrollRight
      >
        {rmuStats.map((line, rowIndex) => (
          <tr key={`rmuLine-${rowIndex}`}>
            <td className="text-left! py-3!">
              <strong className="text-sm">{line.label}</strong>
            </td>
            {line.value.map((cellValue, colIndex) => (
              <td
                key={`${line.label}-${colIndex}`}
                className="whitespace-nowrap align-middle"
              >
                <span className="text-sm">{(cellValue as string) ?? "•"}</span>
              </td>
            ))}
          </tr>
        ))}
      </Table>
    </div>
  );
};

type RMULine = {
  label: string;
  key: string;
  format?: (
    value: string | number | Date,
    periodItem: RmuPeriodStat
  ) => ReactElement | string;
};

type Props = {
  startMonth?: string;
  endMonth?: string;
};
