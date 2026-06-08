import { ReactElement } from "react";

import { Block } from "@/app/components/common/Block";
import { InformationCard } from "@/app/components/InformationCard";

import { useStatistiquesContext } from "../../_context/StatistiquesClientContext";
import { StructuresStatsTable } from "./StructuresStatsTable";
import { TypesBatis } from "./TypesBatis";
import { TypesStructures } from "./TypesStructures";

export const StructuresBlock = (): ReactElement => {
  const { statistiques } = useStatistiquesContext();

  return (
    <Block
      title="Structures"
      iconClass="fr-icon-community-line"
      entity={statistiques}
      entityType="Statistiques"
    >
      <div className="flex pb-16">
        <div className="pr-4">
          <InformationCard
            primaryInformation={statistiques.totalStructures}
            secondaryInformation="structures"
          />
        </div>
        <InformationCard
          primaryInformation={statistiques.totalCpoms}
          secondaryInformation="CPOMs"
        />
      </div>
      <div className="grid grid-cols-2 pb-16">
        <div className="border-r border-default-grey mr-10">
          <TypesStructures />
        </div>
        <TypesBatis />
      </div>
      <StructuresStatsTable />
      <div className="italic text-sm pt-3">
        Les chiffres correspondent au 31 décembre de chaque année.
      </div>
    </Block>
  );
};
