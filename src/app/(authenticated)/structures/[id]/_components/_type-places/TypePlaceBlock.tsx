"use client";

import { useRouter } from "next/navigation";
import { ReactElement } from "react";

import { Block } from "@/app/components/common/Block";
import { InformationCard } from "@/app/components/InformationCard";
import { formatDate } from "@/app/utils/date.util";
import {
  getCurrentPlacesLogementsSociaux,
  getCurrentPlacesQpv,
} from "@/app/utils/structure.util";

import { useStructureContext } from "../../_context/StructureClientContext";
import { TypePlaceCharts } from "./TypePlaceCharts";
import { TypePlaceHistory } from "./TypePlaceHistory";

export const TypePlaceBlock = (): ReactElement => {
  const { structure } = useStructureContext();

  const router = useRouter();

  const { structureTypologies, adresses } = structure;

  const {
    placesACreer,
    placesAFermer,
    echeancePlacesACreer,
    echeancePlacesAFermer,
  } = structureTypologies?.[0] || {};

  return (
    <Block
      title="Type de places"
      iconClass="fr-icon-map-pin-2-line"
      onEdit={() => {
        router.push(`/structures/${structure.id}/modification/03-type-places`);
      }}
    >
      <div className="flex">
        <div className="pr-4">
          <InformationCard
            primaryInformation={
              structureTypologies?.[0].placesAutorisees || "N/A"
            }
            secondaryInformation="places autorisées"
          />
        </div>
        {echeancePlacesACreer && (
          <div className="pr-4">
            <InformationCard
              primaryInformation={`dont ${placesACreer}`}
              secondaryInformation={`places à créer au ${formatDate(
                echeancePlacesACreer
              )}`}
            />
          </div>
        )}
        {echeancePlacesAFermer && (
          <InformationCard
            primaryInformation={`dont ${placesAFermer}`}
            secondaryInformation={`places à fermer au ${formatDate(
              echeancePlacesAFermer
            )}`}
          />
        )}
      </div>
      <div className="pt-3 flex">
        <TypePlaceCharts
          placesAutorisees={structureTypologies?.[0]?.placesAutorisees || 0}
          placesPmr={structureTypologies?.[0]?.pmr || 0}
          placesLgbt={structureTypologies?.[0]?.lgbt || 0}
          placesFvvTeh={structureTypologies?.[0]?.fvvTeh || 0}
          placesQPV={getCurrentPlacesQpv(structure)}
          placesLogementsSociaux={getCurrentPlacesLogementsSociaux(structure)}
        />
      </div>
      <div className="pt-3">
        <TypePlaceHistory
          adresses={adresses || []}
          structureTypologies={structureTypologies || []}
        />
      </div>
    </Block>
  );
};
