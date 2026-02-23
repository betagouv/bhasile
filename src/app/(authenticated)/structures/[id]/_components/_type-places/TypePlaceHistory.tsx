import { Table } from "@codegouvfr/react-dsfr/Table";
import { ReactElement } from "react";

import { CustomAccordion } from "@/app/components/common/CustomAccordion";
import {
  AdresseApiType,
  AdresseTypologieApiType,
} from "@/schemas/api/adresse.schema";
import { StructureTypologieApiType } from "@/schemas/api/structure-typologie.schema";

export const TypePlaceHistory = ({
  adresses,
  structureTypologies,
}: Props): ReactElement => {
  const getCurrentStructureTypologie = (year: number | undefined) => {
    if (year === undefined) {
      return undefined;
    }
    return structureTypologies.find((structureTypologie) => {
      return year === structureTypologie?.year;
    });
  };

  const getYearsFromTypologie = (
    typologies:
      | (AdresseTypologieApiType | undefined)[]
      | StructureTypologieApiType[]
  ) => {
    return typologies.map((typologie) =>
      typologie?.year ? typologie.year : undefined
    );
  };

  const getTableData = () => {
    const adresseTypologies =
      adresses?.flatMap((adresse) => adresse.adresseTypologies) ?? [];

    const allYears = Array.from(
      new Set([
        ...getYearsFromTypologie(adresseTypologies),
        ...getYearsFromTypologie(structureTypologies),
      ])
    ).sort((firstElement, secondElement) =>
      firstElement === undefined
        ? 1
        : secondElement === undefined
          ? -1
          : secondElement - firstElement
    );

    const groupedByYear = adresseTypologies.reduce(
      (aggregatedTypePlaces: AggregatedTypePlaces, adresseTypologie) => {
        const year = adresseTypologie?.year ? adresseTypologie.year : undefined;
        if (!year) {
          return aggregatedTypePlaces;
        }

        if (!aggregatedTypePlaces[year]) {
          aggregatedTypePlaces[year] = {
            placesAutorisees: 0,
            qpv: 0,
            logementSocial: 0,
          };
        }

        aggregatedTypePlaces[year as number].placesAutorisees +=
          adresseTypologie?.placesAutorisees || 0;
        aggregatedTypePlaces[year as number].qpv += adresseTypologie?.qpv || 0;
        aggregatedTypePlaces[year as number].logementSocial +=
          adresseTypologie?.logementSocial || 0;
        return aggregatedTypePlaces;
      },
      {}
    );

    return allYears.map((year) => {
      const data = groupedByYear[year as number] || {
        placesAutorisees: 0,
        qpv: 0,
        logementSocial: 0,
      };
      const currentStructureTypologie = getCurrentStructureTypologie(
        year !== undefined ? year : undefined
      );

      return [
        year,
        <span className="inline-block text-center w-full" key={year}>
          {currentStructureTypologie?.placesAutorisees ?? "N/A"}
        </span>,
        <span className="inline-block text-center w-full" key={year}>
          {currentStructureTypologie?.pmr ?? "N/A"}
        </span>,
        <span className="inline-block text-center w-full" key={year}>
          {currentStructureTypologie?.lgbt ?? "N/A"}
        </span>,
        <span className="inline-block text-center w-full" key={year}>
          {currentStructureTypologie?.fvvTeh ?? "N/A"}
        </span>,
        <span key={year} className="inline-block text-center w-full">
          {data.qpv ?? "N/A"}
        </span>,
        <span key={year} className="inline-block w-20 text-center">
          {data.logementSocial ?? "N/A"}
        </span>,
      ];
    });
  };

  return (
    <CustomAccordion label="Historique">
      <Table
        bordered={true}
        className={`m-0 [&>table]:w-[unset]
           text-mention-grey [&>table>thead]:text-mention-grey [&>table>tbody>tr>td]:p-3 [&>table>thead>tr>th]:text-xs 
           [&>table>thead>tr>th]:whitespace-nowrap [&>table>thead>tr>th]:border-b-grey-300 [&>table>thead>tr>th:last-child]:w-full`}
        caption=""
        data={getTableData()}
        headers={[
          "ANNÉE",
          "AUTORISÉES",
          "PMR",
          "LGBT",
          "FVV-TEH",
          "QPV",
          "LOG. SOCIAL",
        ]}
      />
      <span className="italic block border-t border-default-grey text-mention-grey py-2 px-4 text-xs">
        Les places correspondent aux nombres de places au 1er janvier de chaque
        année
      </span>
    </CustomAccordion>
  );
};

type Props = {
  adresses: AdresseApiType[];
  structureTypologies: StructureTypologieApiType[];
};

type AggregatedTypePlaces = Record<
  number,
  {
    placesAutorisees: number;
    qpv: number;
    logementSocial: number;
  }
>;
