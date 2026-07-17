import { Fragment, ReactElement } from "react";

import { Table } from "@/app/components/common/Table";
import { formatNumber } from "@/app/utils/number.util";
import { StatistiqueApiRead } from "@/schemas/api/statistique.schema";

import { useStatistiquesContext } from "../../_context/StatistiquesClientContext";

export const TypesPlacesStatsTable = (): ReactElement => {
  const { statistiques } = useStatistiquesContext();

  const topLevelStats: StructureStat[] = [
    {
      label: "Places autorisées",
      value: statistiques.places.byYear.map((yearItem) => yearItem.totalPlaces),
    },
    {
      label: "Taux d'équipement",
      value: statistiques.places.byYear.map((yearItem) =>
        formatNumber(Number(yearItem.tauxEquipement) * 1000)
      ),
    },
  ];

  const typePlacesStats = [
    {
      title: "Types de places",
      rows: [
        {
          label: "Places PMR",
          value: statistiques.places.byYear.map((yearItem) => yearItem.pmr),
        },
        {
          label: "Places LGBT",
          subLabel: "(labellisées)",
          value: statistiques.places.byYear.map((yearItem) => yearItem.lgbt),
        },
        {
          label: "Places FVV/TEH",
          subLabel: "(spécialisées)",
          value: statistiques.places.byYear.map((yearItem) => yearItem.fvvTeh),
        },
        {
          label: "Places en QPV",
          value: statistiques.places.byYear.map((yearItem) => yearItem.qpv),
        },
        {
          label: "Places en logements sociaux",
          value: statistiques.places.byYear.map(
            (yearItem) => yearItem.logementsSociaux
          ),
        },
      ],
    },
  ];

  return (
    <div>
      <h4
        className="text-title-blue-france text-lg"
        id="type-places-stats-table"
      >
        Tableau de données
      </h4>
      <Table
        headings={getHeadings(statistiques)}
        ariaLabelledBy="type-places-stats-table"
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
        {typePlacesStats.map((section) => (
          <Fragment key={section.title}>
            <tr>
              <td
                className="text-left! text-xs! font-bold uppercase bg-default-grey-hover!"
                colSpan={statistiques.places.byYear.length + 1}
              >
                <span className="sticky left-4 inline-block h-8 leading-8">
                  {section.title}
                </span>
              </td>
            </tr>
            {section.rows.map((structureStat) => (
              <tr key={structureStat.label}>
                <td className="text-left! py-3! min-w-[240px]">
                  <strong>{structureStat.label}</strong>
                  <br />
                  <span className="text-xs">{structureStat.subLabel}</span>
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

const getHeadings = (statistiques: StatistiqueApiRead) => {
  const dates =
    statistiques.places.byYear.map((yearItem) => {
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

type StructureStat = {
  label: string;
  value?: (string | number | null)[];
};
