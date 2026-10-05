import { Fragment, ReactElement } from "react";

import { NumberDisplay } from "@/app/components/common/NumberDisplay";
import { Table } from "@/app/components/common/Table";
import {
  filterDisplayedYears,
  isYearIncomplete,
} from "@/app/utils/statistiques-period.util";
import { useStatistiquesContext } from "@/contexts/StatistiquesContext";
import { StructuresByYearStat } from "@/schemas/api/statistique.schema";

import { IncompleteDataIndicator } from "../IncompleteDataIndicator";

export const StructuresStatsTable = (): ReactElement => {
  const { statistiques } = useStatistiquesContext();

  const structureYears = filterDisplayedYears(statistiques.structures.byYear);

  const topLevelStats: StructureStat[] = [
    {
      label: "Structures",
      value: structureYears.map((yearItem) => yearItem.totalStructures),
    },
    {
      label: "CPOM complets ou partiels",
      value: structureYears.map((yearItem) => yearItem.totalCpoms),
    },
  ];

  const structureStats = [
    {
      title: "Types de structures",
      rows: [
        {
          label: "CADA",
          value: structureYears.map((yearItem) => yearItem.structuresCada),
        },
        {
          label: "CPH",
          value: structureYears.map((yearItem) => yearItem.structuresCph),
        },
        {
          label: "HUDA",
          value: structureYears.map((yearItem) => yearItem.structuresHuda),
        },
        {
          label: "CAES",
          value: structureYears.map((yearItem) => yearItem.structuresCaes),
        },
      ],
    },
    {
      title: "Types de bâtis",
      rows: [
        {
          label: "Collectif",
          value: structureYears.map(
            (yearItem) => yearItem.structuresBatiCollectif
          ),
        },
        {
          label: "Diffus",
          value: structureYears.map(
            (yearItem) => yearItem.structuresBatiDiffus
          ),
        },
        {
          label: "Mixte",
          value: structureYears.map((yearItem) => yearItem.structuresBatiMixte),
        },
      ],
    },
  ];

  return (
    <div className="break-inside-avoid">
      <h4 className="text-title-blue-france text-lg" id="structure-stats-table">
        Tableau de données
      </h4>
      <Table
        headings={getHeadings(structureYears)}
        ariaLabelledBy="structure-stats-table"
        className="text-mention-grey [&_thead_tr]:bg-transparent! [&_thead_tr]:h-12! w-full"
        enableBorders
        stickFirstColumn
        defaultScrollRight
      >
        {topLevelStats.map((structureStat) => (
          <tr key={structureStat.label}>
            <td className="text-left! py-3!">
              <strong>{structureStat.label}</strong>
              <br />
            </td>
            {structureStat.value?.map((structureStatItem, columnIndex) => {
              const yearItem = structureYears[columnIndex];
              const isIncomplete = isYearIncomplete(yearItem);

              return (
                <td
                  key={`${structureStat.label}-${columnIndex}`}
                  className={`whitespace-nowrap ${
                    isIncomplete ? "bg-default-grey-active" : ""
                  }`}
                >
                  <span className="inline-flex items-center gap-6">
                    <NumberDisplay value={structureStatItem} />
                  </span>
                </td>
              );
            })}
          </tr>
        ))}
        {structureStats.map((section) => (
          <Fragment key={section.title}>
            <tr>
              <td
                className="text-left! text-xs! font-bold uppercase bg-default-grey-hover!"
                colSpan={structureYears.length + 1}
              >
                <span className="sticky left-4 inline-block h-5 leading-6">
                  {section.title}
                </span>
              </td>
            </tr>
            {section.rows.map((structureStat) => (
              <tr key={structureStat.label}>
                <td className="text-left! py-3!">
                  <strong>{structureStat.label}</strong>
                  <br />
                </td>
                {structureStat.value?.map((structureStatItem, columnIndex) => {
                  const yearItem = structureYears[columnIndex];
                  const isIncomplete = isYearIncomplete(yearItem);

                  return (
                    <td
                      key={`${structureStat.label}-${columnIndex}`}
                      className={`whitespace-nowrap ${
                        isIncomplete ? "bg-default-grey-active" : ""
                      }`}
                    >
                      <span className="inline-flex items-center gap-6">
                        <NumberDisplay value={structureStatItem} />
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </Fragment>
        ))}
      </Table>
    </div>
  );
};

const getHeadings = (structureYears: StructuresByYearStat[]) => {
  const dates =
    structureYears.map((yearItem) => {
      const isIncomplete = isYearIncomplete(yearItem);

      return (
        <th
          scope="col"
          key={yearItem.year}
          className={isIncomplete ? "bg-default-grey-active" : undefined}
        >
          <div className="inline-flex items-center justify-center gap-1">
            <span>{yearItem.year}</span>
            {!isIncomplete && <span>*</span>}
            {isIncomplete && (
              // TODO : ajouter de vraies valeurs
              <IncompleteDataIndicator
                nbStructures={42}
                structuresPercentage={42}
              />
            )}
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

type StructureStat = {
  label: string;
  value?: (string | number | null)[];
};
