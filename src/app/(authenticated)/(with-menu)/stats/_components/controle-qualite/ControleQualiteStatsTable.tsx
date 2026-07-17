"use client";

import { Fragment, ReactElement, useState } from "react";

import { Table } from "@/app/components/common/Table";
import {
  TimePeriod,
  TimePeriodSelector,
} from "@/app/components/common/TimePeriodSelector";
import { formatNumber } from "@/app/utils/number.util";
import {
  ControleQualitePeriodStat,
  StatistiqueApiRead,
} from "@/schemas/api/statistique.schema";

import { useStatistiquesContext } from "../../_context/StatistiquesClientContext";

const sectionsConfig: ControleQualiteSectionConfig[] = [
  {
    title: "EIG",
    rows: [
      {
        label: "Structures ne déclarant aucun EIG",
        key: "nbStructuresSansDeclarationEig",
        format: (value, periodItem) => (
          <span>
            {Number(value)}{" "}
            <span className="text-disabled-grey pl-2">
              {formatNumber(
                Number(periodItem.partStructuresSansDeclarationEig),
                {
                  maximumFractionDigits: 2,
                }
              )}
              &nbsp;%
            </span>
          </span>
        ),
      },
      {
        label: "Tous les EIG",
        key: "nbEig",
      },
      {
        label: "EIG “comportement violent“",
        key: "nbEigComportementViolent",
      },
      {
        label: "Taux d'EIG “comportement violent“",
        key: "tauxEigComportementViolent",
        format: (value) =>
          `${formatNumber(Number(value), {
            maximumFractionDigits: 2,
          })} %`,
      },
    ],
  },
  {
    title: "Évaluations",
    rows: [
      {
        label: "Structures évaluées",
        key: "nbStructuresEvaluees",
      },
      {
        label: "Moyenne totale",
        key: "noteGenerale",
      },
      {
        label: "Moyenne “La personne“",
        key: "notePersonne",
      },
      {
        label: "Moyenne “Les professionnels“",
        key: "notePro",
      },
      {
        label: "Moyenne “La structure",
        key: "noteStructure",
      },
    ],
  },
];

export const ControleQualiteStatsTable = (): ReactElement => {
  const { statistiques } = useStatistiquesContext();
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("byYear");

  const controleQualitePeriods =
    statistiques?.controleQualite?.[timePeriod] ?? [];

  const renderPeriodHeader = (period: ControleQualitePeriodStat) => {
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
      ...(statistiques?.controleQualite?.[timePeriod] ?? []).map(
        (period, index) => (
          <th
            scope="col"
            key={`${period.date}-${index}`}
            className="text-center font-bold"
          >
            {renderPeriodHeader(period)}
          </th>
        )
      ),
    ];
  };

  const controleQualiteStats = sectionsConfig.map((section) => ({
    title: section.title,
    rows: section.rows.map((row) => {
      const values = controleQualitePeriods.map((periodItem) => {
        const rawValue = periodItem
          ? periodItem[row.key as keyof ControleQualitePeriodStat]
          : null;

        return row.format && rawValue !== null && rawValue !== undefined
          ? row.format(rawValue, periodItem)
          : rawValue;
      });

      return {
        label: row.label,
        value: values,
      };
    }),
  }));

  const totalColumns = controleQualitePeriods.length + 1;

  return (
    <div>
      <div className="flex">
        <h4
          className="text-title-blue-france text-lg pr-4"
          id="controle-qualite-stats-table"
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
        ariaLabelledBy="controle-qualite-stats-table"
        className="text-mention-grey [&_thead_tr]:bg-transparent! [&_thead_tr]:h-12! w-full"
        enableBorders
        stickFirstColumn
        defaultScrollRight
      >
        {controleQualiteStats.map((section) => (
          <Fragment key={section.title}>
            <tr>
              <td
                className="text-left! text-xs! font-bold uppercase bg-default-grey-hover!"
                colSpan={totalColumns}
              >
                <span className="sticky left-4 inline-block">
                  {section.title}
                </span>
              </td>
            </tr>
            {section.rows.map((row) => (
              <tr key={row.label}>
                <td className="text-left! py-3!">
                  <strong className="text-sm">{row.label}</strong>
                </td>
                {row.value.map((cellValue, index) => (
                  <td
                    key={`${row.label}-${index}`}
                    className="whitespace-nowrap align-middle"
                  >
                    <span className="text-sm">
                      {(cellValue as string) ?? "•"}
                    </span>
                  </td>
                ))}
              </tr>
            ))}
          </Fragment>
        ))}
      </Table>
    </div>
  );
};

type ControleQualiteRowConfig = {
  label: string;
  key: string;
  format?: (
    value: string | number | Date,
    periodItem: ControleQualitePeriodStat
  ) => ReactElement | string;
};

type ControleQualiteSectionConfig = {
  title: string;
  rows: ControleQualiteRowConfig[];
};
