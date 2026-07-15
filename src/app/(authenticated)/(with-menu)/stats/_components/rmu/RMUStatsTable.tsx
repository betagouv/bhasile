"use client";

import { ReactElement, useState } from "react";

import { Table } from "@/app/components/common/Table";
import {
  TimePeriod,
  TimePeriodSelector,
} from "@/app/components/common/TimePeriodSelector";
import { formatNumber } from "@/app/utils/number.util";
import {
  RmuPeriodStat,
  StatistiqueApiRead,
} from "@/schemas/api/statistique.schema";

import { useStatistiquesContext } from "../../_context/StatistiquesClientContext";

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
    format: (value) =>
      `${formatNumber(Number(value), {
        maximumFractionDigits: 2,
      })} %`,
  },
];

export const RMUStatsTable = (): ReactElement => {
  const { statistiques } = useStatistiquesContext();
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("byYear");

  const RMUPeriods = statistiques?.rmu?.[timePeriod] ?? [];

  const renderPeriodHeader = (period: RmuPeriodStat) => {
    const periodDate = new Date(period.date);
    if (timePeriod === "byMonth") {
      return periodDate.toLocaleDateString("fr-FR", {
        month: "short",
        year: "numeric",
      });
    }
    if (timePeriod === "byTrimester") {
      const trimester = Math.floor(periodDate.getMonth() / 3) + 1;
      return `T${trimester} ${periodDate.getFullYear()}`;
    }
    return periodDate.getFullYear();
  };

  const getHeadings = (statistiques: StatistiqueApiRead) => {
    return [
      <th scope="col" key="heading-label" className="min-w-[240px]">
        {" "}
      </th>,
      ...(statistiques?.rmu?.[timePeriod] ?? []).map((period, index) => (
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
          timePeriod={timePeriod}
          setTimePeriod={setTimePeriod}
        />
      </div>
      <Table
        headings={getHeadings(statistiques)}
        ariaLabelledBy="rmu-stats-table"
        className="text-mention-grey [&_thead_tr]:bg-transparent! [&_thead_tr]:h-12! w-full"
        enableBorders
        stickFirstColumn
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
