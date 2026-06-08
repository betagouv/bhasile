import { ReactElement } from "react";

import { Table } from "@/app/components/common/Table";

import { useStatistiquesContext } from "../../_context/StatistiquesClientContext";

export const StructuresStatsTable = (): ReactElement => {
  const { statistiques } = useStatistiquesContext();

  const structureStats: StructureStat[] = [
    {
      id: "structures",
      label: "Structures",
      value: statistiques.structureTypes[0].byYear.map(
        (yearItem) => yearItem.nbStructures
      ),
    },
    {
      id: "cpoms",
      label: "CPOMs complets ou partiels",
      value: statistiques.structureTypes[0].byYear.map(
        (yearItem) => yearItem.nbCpoms
      ),
    },
    ...statistiques.structureTypes.map((structureType) => ({
      id: `structureType-${structureType.label}`,
      label: structureType.label,
      value: structureType.byYear.map((yearItem) => yearItem.nbStructures),
    })),
    ...statistiques.structureBatis.map((structureBati) => ({
      id: `structureBati-${structureBati.label}`,
      label: structureBati.label,
      value: structureBati.byYear.map((yearItem) => yearItem.nbStructures),
    })),
  ];

  const getHeadings = () => {
    const dates =
      statistiques.structureTypes[0].byYear.map((yearItem) => {
        return (
          <th scope="col" key={yearItem.year}>
            {yearItem.year}
          </th>
        );
      }) ?? [];

    return [
      <th scope="col" key="heading-label" className="min-w-[240px]">
        {" "}
      </th>,
      ...dates,
    ];
  };

  return (
    <div>
      <h4 className="text-title-blue-france text-lg" id="structure-stats-table">
        Tableau de données
      </h4>
      <Table
        headings={getHeadings()}
        ariaLabelledBy="structure-stats-table"
        className="text-mention-grey [&_thead_tr]:bg-transparent! [&_thead_tr]:h-12! w-full"
        enableBorders
        stickFirstColumn
        defaultScrollRight
      >
        {structureStats.map((structureStat) => (
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
      </Table>
    </div>
  );
};

type StructureStat = {
  id: string;
  label: string;
  isTitle?: boolean;
  value?: (string | number | null)[];
};
