import { Fragment, ReactElement, ReactNode } from "react";

import { NumberDisplay } from "@/app/components/common/NumberDisplay";
import { Table } from "@/app/components/common/Table";
import { formatPerMille } from "@/app/utils/number.util";
import {
  filterDisplayedYears,
  isYearIncomplete,
} from "@/app/utils/statistiques-period.util";
import { useStatistiquesContext } from "@/contexts/StatistiquesContext";
import { PlacesByYearStat } from "@/schemas/api/statistique.schema";

import { IncompleteDataIndicator } from "../IncompleteDataIndicator";

export const TypesPlacesStatsTable = ({
  startYear,
  endYear,
}: Props): ReactElement => {
  const { statistiques } = useStatistiquesContext();

  const placeYears = filterDisplayedYears(statistiques.places.byYear).filter(
    (yearItem) => {
      if (startYear !== undefined && yearItem.year < startYear) {
        return false;
      }
      if (endYear !== undefined && yearItem.year > endYear) {
        return false;
      }
      return true;
    }
  );

  const topLevelStats: StructureStat[] = [
    {
      label: "Places autorisées",
      value: placeYears.map((yearItem) => (
        <NumberDisplay key={yearItem.year} value={yearItem.totalPlaces} />
      )),
    },
    {
      label: "Taux d'équipement",
      value: placeYears.map((yearItem) =>
        formatPerMille(yearItem.tauxEquipement)
      ),
    },
  ];

  const typePlacesStats = [
    {
      title: "Types de places",
      rows: [
        {
          label: "Places PMR",
          value: placeYears.map((yearItem) => yearItem.pmr),
        },
        {
          label: "Places LGBT",
          subLabel: "(labellisées)",
          value: placeYears.map((yearItem) => yearItem.lgbt),
        },
        {
          label: "Places FVV/TEH",
          subLabel: "(spécialisées)",
          value: placeYears.map((yearItem) => yearItem.fvvTeh),
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
        headings={getHeadings(placeYears)}
        ariaLabelledBy="type-places-stats-table"
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
              const yearItem = placeYears[columnIndex];
              const isIncomplete = isYearIncomplete(yearItem);

              return (
                <td
                  key={`${structureStat.label}-${columnIndex}`}
                  className={`whitespace-nowrap ${
                    isIncomplete ? "bg-default-grey-active" : ""
                  }`}
                >
                  <span className="inline-flex items-center gap-6">
                    <span>{structureStatItem}</span>
                  </span>
                </td>
              );
            })}
          </tr>
        ))}
        {typePlacesStats.map((section) => (
          <Fragment key={section.title}>
            <tr>
              <td
                className="text-left! text-xs! font-bold uppercase bg-default-grey-hover!"
                colSpan={placeYears.length + 1}
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
                  <span className="text-xs">{structureStat.subLabel}</span>
                </td>
                {structureStat.value?.map((structureStatItem, columnIndex) => {
                  const yearItem = placeYears[columnIndex];
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

const getHeadings = (placeYears: PlacesByYearStat[]) => {
  const currentYear = new Date().getFullYear();

  const dates =
    placeYears.map((yearItem) => {
      const isIncomplete = isYearIncomplete(yearItem);
      const isNotCurrentYear = Number(yearItem.year) !== currentYear;

      return (
        <th
          scope="col"
          key={yearItem.year}
          className={isIncomplete ? "bg-default-grey-active" : undefined}
        >
          <div className="inline-flex items-center justify-center gap-1">
            <span>
              {yearItem.year}
              {isNotCurrentYear && "*"}
            </span>
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
  value?: ReactNode[];
};

type Props = {
  startYear?: number;
  endYear?: number;
};
