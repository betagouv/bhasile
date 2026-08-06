"use client";

import { ReactElement } from "react";

import { Block } from "@/app/components/common/Block";
import { InformationCard } from "@/app/components/InformationCard";
import { getMostRecentMillesime } from "@/app/utils/structure.util";
import { useStructureContext } from "@/contexts/StructureContext";

export const PrahdaTypePlaceBlock = (): ReactElement => {
  const { structure } = useStructureContext();

  return (
    <Block
      title="Type de places"
      iconClass="fr-icon-map-pin-2-line"
      entity={structure}
      entityType="Structure"
    >
      <InformationCard
        primaryInformation={
          getMostRecentMillesime(structure.structureTypologies)
            ?.placesAutorisees || "N/A"
        }
        secondaryInformation="places autorisées"
      />
    </Block>
  );
};
