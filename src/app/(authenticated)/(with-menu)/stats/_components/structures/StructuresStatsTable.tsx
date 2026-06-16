import { Fragment, ReactElement } from "react";

import { Table } from "@/app/components/common/Table";
import { StatistiquesApiType } from "@/schemas/api/statistiques.schema";

import { useStatistiquesContext } from "../../_context/StatistiquesClientContext";

export const StructuresStatsTable = (): ReactElement => {
  const { statistiques } = useStatistiquesContext();

  const topLevelStats: StructureStat[] = [
    {
      id: "structures",
      label: "Structures",
      value: statistiques.structureTypes?.[0]?.byYear
        .map((_, yearIndex) =>
          statistiques.structureTypes.reduce(
            (sum, structureType) =>
              sum + (structureType.byYear[yearIndex]?.nbStructures ?? 0),
            0
          )
        )
        .reverse(),
    },
    {
      id: "cpoms",
      label: "CPOMs complets ou partiels",
      value: statistiques.structureTypes?.[0]?.byYear
        .map((_, yearIndex) =>
          statistiques.structureTypes.reduce(
            (sum, structureType) =>
              sum + (structureType.byYear[yearIndex]?.nbCpoms ?? 0),
            0
          )
        )
        .reverse(),
    },
  ];

  const structureStats = [
    {
      title: "Types de structures",
      rows: statistiques.structureTypes.map((structureType) => ({
        id: `structureType-${structureType.label}`,
        label: structureType.label,
        value: structureType.byYear
          .map((yearItem) => yearItem.nbStructures)
          .reverse(),
      })),
    },
    {
      title: "Types de bâtis",
      rows: statistiques.structureBatis.map((structureBati) => ({
        id: `structureBati-${structureBati.label}`,
        label: structureBati.label,
        value: structureBati.byYear
          .map((yearItem) => yearItem.nbStructures)
          .reverse(),
      })),
    },
  ];

  return (
    <div>
      <h4 className="text-title-blue-france text-lg" id="structure-stats-table">
        Tableau de données
      </h4>
      <Table
        headings={getHeadings(statistiques)}
        ariaLabelledBy="structure-stats-table"
        className="text-mention-grey [&_thead_tr]:bg-transparent! [&_thead_tr]:h-12! w-full"
        enableBorders
        stickFirstColumn
        defaultScrollRight
      >
        {topLevelStats.map((structureStat) => (
          <tr key={structureStat.label}>
            <td className="text-left! py-3! min-w-[240px]">
              <strong>{structureStat.label}</strong>
              <br />
            </td>
            {structureStat.value?.map((structureStatItem, index) => (
              <td
                key={`${structureStat.label}-${index}`}
                className="min-w-[132px] whitespace-nowrap"
              >
                <span className="inline-flex items-center gap-6">
                  <span>{structureStatItem?.toString()}</span>
                </span>
              </td>
            ))}
          </tr>
        ))}
        {structureStats.map((section) => (
          <Fragment key={section.title}>
            <tr>
              <td
                className="text-left! text-xs! font-bold uppercase bg-default-grey-hover!"
                colSpan={statistiques.structureTypes[0].byYear.length + 1}
              >
                <span className="sticky left-4 inline-block">
                  {section.title}
                </span>
              </td>
            </tr>
            {section.rows.map((structureStat) => (
              <tr key={structureStat.label}>
                <td className="text-left! py-3! min-w-[240px]">
                  <strong>{structureStat.label}</strong>
                  <br />
                </td>
                {structureStat.value?.map((structureStatItem, index) => (
                  <td
                    key={`${structureStat.label}-${index}`}
                    className="min-w-[132px] whitespace-nowrap"
                  >
                    <span className="inline-flex items-center gap-6">
                      <span>{structureStatItem?.toString()}</span>
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

const getHeadings = (statistiques: StatistiquesApiType) => {
  const dates =
    statistiques.structureTypes[0].byYear
      .map((yearItem) => {
        return (
          <th scope="col" key={yearItem.year}>
            {yearItem.year}
          </th>
        );
      })
      .reverse() ?? [];

  return [
    <th scope="col" key="heading-label" className="min-w-[240px]">
      {" "}
    </th>,
    ...dates,
  ];
};

type StructureStat = {
  id: string;
  label: string;
  value?: (string | number | null)[];
};
