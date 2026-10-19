import { Fragment, ReactElement } from "react";

import { NumberDisplay } from "@/app/components/common/NumberDisplay";
import { Table } from "@/app/components/common/Table";
import {
  filterDisplayedYears,
  isYearIncomplete,
  shouldShowYearAsterisk,
} from "@/app/utils/statistiques-period.util";
import { useStatistiquesContext } from "@/contexts/StatistiquesContext";
import { StructuresByYearStat } from "@/schemas/api/statistique.schema";
import { Repartition, RepartitionLabel } from "@/types/adresse.type";
import { StructureType } from "@/types/structure.type";

const STRUCTURE_TYPE_ROWS = [
  StructureType.CADA,
  StructureType.CPH,
  StructureType.HUDA,
  StructureType.CAES,
];

const BATI_ROWS = [
  Repartition.COLLECTIF,
  Repartition.DIFFUS,
  Repartition.MIXTE,
];

import { getPercentage } from "@/app/utils/common.util";
import { useExportContext } from "@/contexts/ExportContext";

import { IncompleteDataIndicator } from "../IncompleteDataIndicator";

export const StructuresStatsTable = (): ReactElement => {
  const { statistiques } = useStatistiquesContext();
  const isExporting = useExportContext();

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
      rows: STRUCTURE_TYPE_ROWS.map((type) => ({
        label: type,
        value: structureYears.map(
          (yearItem) =>
            yearItem.structureTypes.find((stat) => stat.type === type)
              ?.structures ?? 0
        ),
      })),
    },
    {
      title: "Types de bâtis",
      rows: BATI_ROWS.map((bati) => ({
        label: RepartitionLabel[bati],
        value: structureYears.map(
          (yearItem) =>
            yearItem.structureBatis.find((stat) => stat.bati === bati)
              ?.structures ?? 0
        ),
      })),
    },
  ];

  return (
    <div className="break-inside-avoid">
      <h4 className="text-title-blue-france text-lg" id="structure-stats-table">
        Tableau de données
      </h4>
      <Table
        headings={getHeadings(structureYears, isExporting)}
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
              const isIncomplete = isYearIncomplete(
                statistiques.structures.byYear[columnIndex].completude
              );

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
                  const isIncomplete = isYearIncomplete(
                    statistiques.structures.byYear[columnIndex].completude
                  );

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

const getHeadings = (
  structureYears: StructuresByYearStat[],
  isExporting: boolean
) => {
  const dates =
    structureYears.map((yearItem) => {
      const isIncomplete = isYearIncomplete(yearItem.completude);
      const nbRenseignees = yearItem.completude?.nbRenseignees ?? 0;
      const nbAttendues = yearItem.completude?.nbAttendues ?? 1;

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

type StructureStat = {
  label: string;
  value?: (string | number | null)[];
};
