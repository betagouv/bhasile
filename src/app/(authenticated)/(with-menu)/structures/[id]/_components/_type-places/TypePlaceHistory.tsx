"use client";

import { ReactElement } from "react";

import { CustomAccordion } from "@/app/components/common/CustomAccordion";
import { EmptyCell } from "@/app/components/common/EmptyCell";
import { Table } from "@/app/components/common/Table";
import { getTransformationMarkers } from "@/app/components/transformation-markers/getTransformationMarkers";
import { TransformationMarkers } from "@/app/components/transformation-markers/TransformationMarkers";
import { getTypePlacesYearRange } from "@/app/utils/date.util";

import { useStructureContext } from "../../_context/StructureClientContext";
import { getTypePlaceHistoryHeadings } from "./getTypePlaceHistoryHeadings";

export const TypePlaceHistory = (): ReactElement => {
  const { structure } = useStructureContext();
  const years = [...getTypePlacesYearRange().years].sort(
    (firstYear, secondYear) => firstYear - secondYear
  );
  const markers = getTransformationMarkers(structure.history, years);

  const structureTypologies = structure.structureTypologies ?? [];
  const adresseTypologies = (structure.adresses ?? []).flatMap(
    (adresse) => adresse.adresseTypologies
  );

  const adressePlacesByYear = new Map<
    number,
    { qpv: number; logementSocial: number }
  >();
  for (const adresseTypologie of adresseTypologies) {
    const aggregated = adressePlacesByYear.get(adresseTypologie.year) ?? {
      qpv: 0,
      logementSocial: 0,
    };
    aggregated.qpv += adresseTypologie.qpv;
    aggregated.logementSocial += adresseTypologie.logementSocial;
    adressePlacesByYear.set(adresseTypologie.year, aggregated);
  }

  const getStructureTypologie = (year: number) =>
    structureTypologies.find(
      (structureTypologie) => structureTypologie.year === year
    );

  const rows: PlaceRow[] = [
    {
      label: "Places autorisées",
      getValue: (year) =>
        getStructureTypologie(year)?.placesAutorisees ?? undefined,
    },
    {
      label: "Places PMR",
      getValue: (year) => getStructureTypologie(year)?.pmr,
    },
    {
      label: "Places LGBT",
      subLabel: "(labelisées)",
      getValue: (year) => getStructureTypologie(year)?.lgbt,
    },
    {
      label: "Places FVV/TEH",
      subLabel: "(spécialisées)",
      getValue: (year) => getStructureTypologie(year)?.fvvTeh,
    },
    {
      label: "Places en QPV",
      getValue: (year) => adressePlacesByYear.get(year)?.qpv,
    },
    {
      label: "Places en logements sociaux",
      getValue: (year) => adressePlacesByYear.get(year)?.logementSocial,
    },
  ];

  return (
    <CustomAccordion label="Historique">
      <h3 id="type-places-historique-title" className="sr-only">
        Historique des types de places
      </h3>
      <Table
        ariaLabelledBy="type-places-historique-title"
        headings={getTypePlaceHistoryHeadings(years)}
        className="text-mention-grey [&_thead_tr]:bg-transparent!"
        enableBorders
        stickFirstColumn
        overlay={
          markers.length > 0 && (
            <TransformationMarkers markers={markers} years={years} />
          )
        }
      >
        {rows.map((row) => (
          <tr key={row.label}>
            <td className="text-left! min-w-[240px]">
              <strong>{row.label}</strong>
              {row.subLabel && (
                <>
                  <br />
                  <span className="text-xs">{row.subLabel}</span>
                </>
              )}
            </td>
            {years.map((year) => (
              <td key={year} className="min-w-[100px] whitespace-nowrap">
                {row.getValue(year) ?? <EmptyCell />}
              </td>
            ))}
          </tr>
        ))}
      </Table>
      <span className="italic block border-t border-default-grey text-mention-grey py-2 px-4 text-xs">
        Les chiffres correspondent aux nombres de places au 31 décembre de
        chaque année.
      </span>
    </CustomAccordion>
  );
};

type PlaceRow = {
  label: string;
  subLabel?: string;
  getValue: (year: number) => number | undefined;
};
