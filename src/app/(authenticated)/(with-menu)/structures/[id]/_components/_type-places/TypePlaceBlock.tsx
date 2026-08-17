"use client";

import { useRouter } from "next/navigation";
import { ReactElement } from "react";

import { Block } from "@/app/components/common/Block";
import { DocumentDownloadDropdown } from "@/app/components/download/DocumentDownloadDropdown";
import { InformationCard } from "@/app/components/InformationCard";
import { getTypePlacesYearRange } from "@/app/utils/date.util";
import { getMostRecentMillesime } from "@/app/utils/structure.util";
import { useStructureContext } from "@/contexts/StructureContext";

import { TypePlaceCharts } from "./TypePlaceCharts";
import { TypePlaceHistory } from "./TypePlaceHistory";

export const TypePlaceBlock = (): ReactElement => {
  const { structure } = useStructureContext();

  const router = useRouter();

  const currentTypologie = getMostRecentMillesime(
    structure.structureTypologies
  );

  const typePlacesDownloadContent = {
    fileName: `type-places-${structure.codeBhasile}`,
    sheetName: "Type de places",
    data: structure.structureTypologies
      .map((structureTypologie) => ({
        ...structureTypologie,
        placesAutorisees: structureTypologie.placesAutorisees!,
      }))
      .filter((structureTypologie) =>
        getTypePlacesYearRange().years.includes(structureTypologie.year)
      ),
    headersMap: {
      year: "Année",
      placesAutorisees: "Places autorisées",
      pmr: "Places PMR",
      lgbt: "Places LGBT",
      fvvTeh: "Places FVV/TEH",
    },
  };

  return (
    <Block
      title="Type de places"
      iconClass="fr-icon-map-pin-2-line"
      onEdit={() => {
        router.push(`/structures/${structure.id}/modification/type-places`);
      }}
      entity={structure}
      entityType="Structure"
      downloadDropdown={
        <DocumentDownloadDropdown downloadContent={typePlacesDownloadContent} />
      }
    >
      <div className="flex">
        <div className="pr-4">
          <InformationCard
            primaryInformation={currentTypologie?.placesAutorisees || "N/A"}
            secondaryInformation="places autorisées"
          />
        </div>
      </div>
      <div className="pt-12 flex">
        <TypePlaceCharts
          placesAutorisees={currentTypologie?.placesAutorisees || 0}
          placesPmr={currentTypologie?.pmr || 0}
          placesLgbt={currentTypologie?.lgbt || 0}
          placesFvvTeh={currentTypologie?.fvvTeh || 0}
          placesQPV={structure.currentPlaces.qpv}
          placesLogementsSociaux={structure.currentPlaces.logementsSociaux}
        />
      </div>
      <div className="pt-6">
        <TypePlaceHistory />
      </div>
    </Block>
  );
};
