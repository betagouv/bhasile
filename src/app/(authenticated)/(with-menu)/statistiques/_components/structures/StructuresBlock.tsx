"use client";

import { ReactElement } from "react";

import { InformationCard } from "@/app/components/InformationCard";
import { InformationCardBridge } from "@/app/components/InformationCardBridge";

import { useStatistiquesContext } from "../../_context/StatistiquesClientContext";
import { StructuresStatsTable } from "./StructuresStatsTable";
import { TypesBatis } from "./TypesBatis";
import { TypesStructures } from "./TypesStructures";

export const StructuresBlock = (): ReactElement => {
  const { statistiques } = useStatistiquesContext();

  return (
    <div className="bg-white pt-6 px-6 pb-8 border border-default-grey rounded-[10px] border-solid">
      <div className="flex justify-between items-start">
        <div className="flex">
          <span className="text-title-blue-france mr-3 fr-icon-community-line" />
          <h3 className="text-title-blue-france fr-h6 mb-12">Structures</h3>
        </div>
      </div>
      <div className="flex pb-16">
        <div className="pr-4">
          <InformationCard
            primaryInformation={statistiques.structures.totalStructures}
            secondaryInformation="structures"
          />
        </div>
        <InformationCard
          primaryInformation={statistiques.structures.totalCpoms}
          secondaryInformation="CPOM"
        />
        <InformationCardBridge />
        <InformationCard
          primaryInformation={statistiques.structures.structuresAvecCpom}
          secondaryInformation="structures concernées"
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
        Les chiffres correspondent au 31 décembre de chaque année, et à la
        dernière mise à jour pour l’année en cours.
      </div>
    </div>
  );
};
