"use client";

import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { ComponentProps, Fragment, ReactElement } from "react";

import { NumberDisplay } from "@/app/components/common/NumberDisplay";
import { Table } from "@/app/components/common/Table";
import { getPercentage } from "@/app/utils/common.util";
import {
  filterDisplayedYears,
  isYearIncomplete,
  shouldShowYearAsterisk,
} from "@/app/utils/statistiques-period.util";
import { CURRENT_YEAR } from "@/constants";
import { useExportContext } from "@/contexts/ExportContext";
import { useStatistiquesContext } from "@/contexts/StatistiquesContext";
import {
  CompletudeStat,
  FinanceByYearStat,
} from "@/schemas/api/statistique.schema";

import { IncompleteDataIndicator } from "../IncompleteDataIndicator";

type VisualizationType = "total" | "autorisees" | "subventionnees";

const sectionsConfig: FinanceSectionConfig[] = [
  {
    title: "Indicateurs généraux",
    rows: [
      {
        label: "Nombre d’ETP prévisionnel",
        key: "totalETPPrevisionnel",
      },
      {
        label: "Nombre d’ETP réel",
        key: "totalETPRealise",
      },
      {
        label: "Taux d’encadrement cible moyen",
        key: "tauxEncadrementCible",
      },
      {
        label: "Taux d’encadrement théorique prévisionnel moyen",
        key: "tauxEncadrementTheoriquePrevisionnel",
      },
      {
        label: "Taux d’encadrement théorique réel moyen",
        key: "tauxEncadrementTheoriqueRealise",
      },
      {
        label: "Coût journalier cible moyen",
        key: "coutJournalierCible",
        type: "currency",
      },
      {
        label: "Coût journalier théorique moyen",
        key: "coutJournalierTheorique",
        type: "currency",
      },
    ],
  },
  {
    title: "Budget",
    rows: [
      {
        label: "Dotation demandée",
        key: "dotationDemandee",
        type: "currency",
        maximumFractionDigits: 0,
      },
      {
        label: "Dotation accordée",
        key: "dotationAccordee",
        type: "currency",
        maximumFractionDigits: 0,
      },
    ],
  },
  {
    title: "Résultat",
    rows: [
      {
        label: "Total des produits retenu",
        subLabel: "dont dotation État",
        key: "totalProduits",
        type: "currency",
        maximumFractionDigits: 0,
        emptyYearsStart: CURRENT_YEAR,
      },
      {
        label: "Total charges retenu",
        subLabel: "par les autorités tarifaires",
        key: "totalCharges",
        type: "currency",
        maximumFractionDigits: 0,
        emptyYearsStart: CURRENT_YEAR,
      },
      {
        label: "Résultat net retenu",
        subLabel: "par les autorités tarifaires",
        key: "resultatNet",
        type: "currency",
        maximumFractionDigits: 0,
        isBadge: true,
        emptyYearsStart: CURRENT_YEAR,
      },
    ],
  },
];

export const FinancesTablePresenter = ({
  visualization,
  tableId = "finances-stats-table",
  startYear,
  endYear,
}: Props): ReactElement => {
  const { statistiques } = useStatistiquesContext();
  const isExporting = useExportContext();

  const financeYears = filterDisplayedYears(
    statistiques?.finance?.byYear ?? []
  ).filter((yearItem) => {
    if (startYear !== undefined && yearItem.year < startYear) {
      return false;
    }
    if (endYear !== undefined && yearItem.year > endYear) {
      return false;
    }
    return true;
  });

  const completudeByYear = new Map<number, CompletudeStat | undefined>(
    (statistiques?.finance?.byYear ?? []).map(
      (yearItem) =>
        [
          yearItem.year,
          yearItem[visualization].completude ?? undefined,
        ] as const
    )
  );

  const financeStats = sectionsConfig.map((section) => ({
    title: section.title,
    rows: section.rows.map((row) => {
      const values = financeYears.map((yearItem) => {
        const visualizationType = yearItem[visualization];
        const isEmptyYear =
          row.emptyYearsStart !== undefined &&
          yearItem.year >= row.emptyYearsStart;
        const rawValue =
          visualizationType && !isEmptyYear
            ? (visualizationType[row.key as keyof typeof visualizationType] as
                number | null)
            : null;

        return {
          display: (
            <NumberDisplay
              value={rawValue}
              type={row.type}
              maximumFractionDigits={row.maximumFractionDigits}
              showEmptyCell
            />
          ),
          raw: rawValue,
        };
      });

      return {
        label: row.label,
        subLabel: row.subLabel,
        cells: values,
        isBadge: row.isBadge ?? false,
      };
    }),
  }));

  const totalColumns = financeYears.length + 1;

  return (
    <Table
      headings={getHeadings(
        financeYears,
        completudeByYear,
        visualization,
        isExporting
      )}
      ariaLabelledBy={tableId}
      className="text-mention-grey [&_thead_tr]:bg-transparent! [&_thead_tr]:h-12! w-full break-inside-avoid"
      enableBorders
      stickFirstColumn
      defaultScrollRight
    >
      {financeStats.map((section) => (
        <Fragment key={section.title}>
          <tr>
            <td
              className="text-left! text-xs! font-bold uppercase bg-default-grey-hover!"
              colSpan={totalColumns}
            >
              <span className="sticky left-4 inline-block h-5 leading-6">
                {section.title}
              </span>
            </td>
          </tr>
          {section.rows.map((row) => (
            <tr key={row.label}>
              <td className="text-left! py-3!">
                <strong className="text-sm">{row.label}</strong>
                {row.subLabel && (
                  <>
                    <br />
                    <span className="text-xs text-mention-grey font-normal">
                      {row.subLabel}
                    </span>
                  </>
                )}
              </td>
              {row.cells.map((cell, columnIndex) => {
                const isIncomplete = isYearIncomplete(
                  financeYears[columnIndex][visualization].completude
                );

                return (
                  <td
                    key={`${row.label}-${columnIndex}`}
                    className={`whitespace-nowrap align-middle ${
                      isIncomplete ? "bg-default-grey-active" : ""
                    }`}
                  >
                    {row.isBadge &&
                    cell.raw !== null &&
                    cell.raw !== undefined ? (
                      <Badge
                        severity={cell.raw < 0 ? "error" : "success"}
                        noIcon
                      >
                        {cell.raw < 0 ? "" : "+ "}
                        {cell.display}
                      </Badge>
                    ) : (
                      <span className="text-sm">{cell.display}</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </Fragment>
      ))}
    </Table>
  );
};

const getHeadings = (
  financeYears: FinanceByYearStat[],
  completudeByYear: ReadonlyMap<number, CompletudeStat | undefined>,
  visualization: VisualizationType,
  isExporting: boolean
) => {
  const dates =
    financeYears.map((yearItem, index) => {
      const isIncomplete = isYearIncomplete(yearItem[visualization].completude);
      const completude = completudeByYear.get(yearItem.year);
      const nbRenseignees = completude?.nbRenseignees ?? 0;
      const nbAttendues = completude?.nbAttendues ?? 1;

      return (
        <th
          scope="col"
          key={yearItem.year}
          className={isIncomplete ? "bg-default-grey-active" : undefined}
        >
          <div className="inline-flex print:block items-center justify-center gap-1">
            <span>{yearItem.year}</span>
            {shouldShowYearAsterisk(yearItem.year) && <span>*</span>}
            {isIncomplete &&
              (isExporting ? (
                <div className="text-[10px] font-normal">
                  {nbRenseignees} structures actualisées
                </div>
              ) : (
                <IncompleteDataIndicator
                  nbStructures={nbRenseignees}
                  structuresPercentage={getPercentage(
                    nbRenseignees,
                    nbAttendues
                  )}
                  align={index === financeYears.length - 1 ? "end" : null}
                />
              ))}
          </div>
        </th>
      );
    }) ?? [];

  return [
    <th scope="col" key="heading-label">
      {" "}
    </th>,
    ...dates,
  ];
};

type FinanceRowConfig = {
  label: string;
  key: string;
  type?: ComponentProps<typeof NumberDisplay>["type"];
  maximumFractionDigits?: number;
  subLabel?: string;
  isBadge?: boolean;
  emptyYearsStart?: number;
};

type FinanceSectionConfig = {
  title: string;
  rows: FinanceRowConfig[];
};

type Props = {
  visualization: VisualizationType;
  tableId?: string;
  startYear?: number;
  endYear?: number;
};
