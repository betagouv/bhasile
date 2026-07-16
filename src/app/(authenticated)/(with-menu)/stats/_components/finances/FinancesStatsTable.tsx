"use client";

import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { Fragment, ReactElement, useState } from "react";

import { Table } from "@/app/components/common/Table";
import { StatistiqueApiRead } from "@/schemas/api/statistique.schema";

import { useStatistiquesContext } from "../../_context/StatistiquesClientContext";
import { FinanceTypeSelector } from "./FinanceTypeSelector";

export const FinancesStatsTable = (): ReactElement => {
  const { statistiques } = useStatistiquesContext();

  const financeYears = statistiques?.finance?.byYear ?? [];

  const [visualization, setVisualization] = useState<
    "total" | "autorisees" | "subventionnees"
  >("total");

  const sectionsConfig: FinanceSectionConfig[] = [
    {
      title: "Indicateurs généraux",
      rows: [
        {
          label: "Nombre d’ETP",
          key: "totalETP",
          format: (value) => value ?? "•",
        },
        {
          label: "Taux d’encadrement moyen",
          key: "tauxEncadrement",
          format: (value) => value ?? "•",
        },
        {
          label: "Coût journalier moyen",
          key: "coutJournalier",
          format: (value) => (value ? `${value} €` : "•"),
        },
      ],
    },
    {
      title: "Budget",
      rows: [
        {
          label: "Dotation demandée",
          key: "dotationDemandee",
          format: (value) =>
            value ? `${value.toLocaleString("fr-FR")} €` : "•",
        },
        {
          label: "Dotation accordée",
          key: "dotationAccordee",
          format: (value) =>
            value ? `${value.toLocaleString("fr-FR")} €` : "•",
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
          format: (value) =>
            value ? `${value.toLocaleString("fr-FR")} €` : "•",
        },
        {
          label: "Total charges retenu",
          subLabel: "par les autorités tarifaires",
          key: "totalCharges",
          format: (value) =>
            value ? `${value.toLocaleString("fr-FR")} €` : "•",
        },
        {
          label: "Résultat net retenu",
          subLabel: "par les autorités tarifaires",
          key: "resultatNet",
          format: (value) =>
            value ? `${value.toLocaleString("fr-FR")} €` : "•",
          isBadge: true,
        },
      ],
    },
  ];

  const financeStats = sectionsConfig.map((section) => ({
    title: section.title,
    rows: section.rows.map((row) => {
      const values = financeYears.map((yearItem) => {
        const visualizationType = yearItem[visualization];
        const rawValue = visualizationType
          ? visualizationType[row.key as keyof typeof visualizationType]
          : null;
        return row.format(rawValue);
      });

      return {
        label: row.label,
        subLabel: row.subLabel,
        value: values,
        isBadge: row.isBadge ?? false,
      };
    }),
  }));

  const totalColumns = financeYears.length + 1;

  return (
    <div>
      <div className="flex">
        <h4
          className="text-title-blue-france text-lg pr-4"
          id="finances-stats-table"
        >
          Tableau de données
        </h4>
        <FinanceTypeSelector
          visualization={visualization}
          setVisualization={setVisualization}
        />
      </div>
      <Table
        headings={getHeadings(statistiques)}
        ariaLabelledBy="finances-stats-table"
        className="text-mention-grey [&_thead_tr]:bg-transparent! [&_thead_tr]:h-12! w-full"
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
                <span className="sticky left-4 inline-block h-8 leading-8">
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
                {row.value.map((cellValue, index) => (
                  <td
                    key={`${row.label}-${index}`}
                    className="whitespace-nowrap align-middle"
                  >
                    {row.isBadge && cellValue !== "•" ? (
                      <Badge
                        severity={
                          cellValue.toString().startsWith("-")
                            ? "error"
                            : "success"
                        }
                        noIcon
                      >
                        {cellValue.toString().startsWith("-")
                          ? cellValue
                          : `+ ${cellValue}`}
                      </Badge>
                    ) : (
                      <span className="text-sm">{cellValue}</span>
                    )}
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

const getHeadings = (statistiques: StatistiqueApiRead) => {
  const financeYears = statistiques?.finance?.byYear ?? [];

  const dates = financeYears.map((yearItem) => (
    <th scope="col" key={yearItem.year} className="text-center font-bold">
      {yearItem.year}
    </th>
  ));

  return [
    <th scope="col" key="heading-label" className="min-w-[240px]">
      {" "}
    </th>,
    ...dates,
  ];
};

type FinanceRowConfig = {
  label: string;
  key: string;
  format: (value?: number | null) => string | number;
  subLabel?: string;
  isBadge?: boolean;
};

type FinanceSectionConfig = {
  title: string;
  rows: FinanceRowConfig[];
};
