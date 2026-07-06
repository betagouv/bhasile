"use client";

import { ReactElement } from "react";

import { InformationCard } from "@/app/components/InformationCard";

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
        <div className="relative flex flex-col justify-between self-center w-[16px] h-[44px] bg-slate-100">
          <div className="absolute top-0 left-0 right-0 h-[8px] bg-white rounded-b-full" />
          <div className="absolute bottom-0 left-0 right-0 h-[8px] bg-white rounded-t-full" />
        </div>
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
        Les chiffres correspondent au 31 décembre de chaque année.
      </div>
    </div>
  );
};
