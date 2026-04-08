"use client";

import { ReactElement } from "react";

import { Block } from "@/app/components/common/Block";
import { InformationCard } from "@/app/components/InformationCard";

import { useStructureContext } from "../../_context/StructureClientContext";

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
          structure.structureTypologies?.[0]?.placesAutorisees || "N/A"
        }
        secondaryInformation="places autorisées"
      />
    </Block>
  );
};
